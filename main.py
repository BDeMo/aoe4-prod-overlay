"""
AoE4 Production Overlay
A floating, semi-transparent overlay that calculates villager requirements
for unit production in Age of Empires IV.
"""

import sys
import os
import re
import time
from PyQt5.QtWidgets import QApplication, QMainWindow, QSystemTrayIcon, QMenu, QAction, QWidget
from PyQt5.QtCore import Qt, QUrl, QTimer, QThread, pyqtSignal, QPoint
from PyQt5.QtGui import QIcon, QColor, QCursor, QPainter, QPen, QFont, QPixmap
from PyQt5.QtWebEngineWidgets import QWebEngineView, QWebEnginePage, QWebEngineSettings

from screen_scanner import ScreenScanner


# ---- Log Watcher Thread ----
class LogWatcher(QThread):
    """Monitors AoE4 warnings.log for match events."""
    steam_id_found = pyqtSignal(str, str)  # (steam_id, steam_name)
    match_started = pyqtSignal()
    match_ended = pyqtSignal()

    LOG_DIR = os.path.expanduser(r"~\Documents\My Games\Age of Empires IV")
    LOG_FILE = "warnings.log"

    def __init__(self, parent=None):
        super().__init__(parent)
        self._running = True
        self._steam_id = None
        self._steam_name = None

    def run(self):
        log_path = os.path.join(self.LOG_DIR, self.LOG_FILE)

        # Parse existing log for steam ID and name
        self._parse_initial(log_path)

        # Tail the log for match events
        self._tail_log(log_path)

    def _parse_initial(self, log_path):
        """Read existing log to extract Steam ID and name."""
        if not os.path.exists(log_path):
            return
        try:
            with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    self._extract_steam_info(line)
                    if self._steam_id and self._steam_name:
                        self.steam_id_found.emit(self._steam_id, self._steam_name)
                        break
        except Exception:
            pass

    def _tail_log(self, log_path):
        """Continuously tail the log file for match events."""
        if not os.path.exists(log_path):
            # Wait for file to appear
            while self._running and not os.path.exists(log_path):
                time.sleep(2)

        try:
            with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
                # Seek to end
                f.seek(0, 2)
                while self._running:
                    line = f.readline()
                    if not line:
                        time.sleep(0.5)
                        # Check if file was recreated (game restart)
                        try:
                            current_size = os.path.getsize(log_path)
                            if current_size < f.tell():
                                # File was truncated/recreated, reopen
                                f.close()
                                time.sleep(1)
                                f2 = open(log_path, 'r', encoding='utf-8', errors='ignore')
                                self._parse_initial(log_path)
                                f2.seek(0, 2)
                                # Continue with new file handle
                                while self._running:
                                    line2 = f2.readline()
                                    if not line2:
                                        time.sleep(0.5)
                                        continue
                                    self._process_line(line2)
                                f2.close()
                                return
                        except Exception:
                            pass
                        continue
                    self._process_line(line)
        except Exception:
            pass

    def _extract_steam_info(self, line):
        """Extract Steam ID and name from a log line."""
        if not self._steam_name:
            m = re.search(r'Current Steam name is \[(.+?)\]', line)
            if m:
                self._steam_name = m.group(1)
        if not self._steam_id:
            m = re.search(r'Found profile: /steam/(\d+)', line)
            if m:
                self._steam_id = m.group(1)

    def _process_line(self, line):
        """Process a new log line for match events."""
        # Also pick up steam info if we missed it
        if not self._steam_id or not self._steam_name:
            old_id, old_name = self._steam_id, self._steam_name
            self._extract_steam_info(line)
            if self._steam_id and self._steam_name and (self._steam_id != old_id or self._steam_name != old_name):
                self.steam_id_found.emit(self._steam_id, self._steam_name)

        if '[Match Flow] Start Match Command' in line:
            self.match_started.emit()
        elif 'Disconnect called with reasonID' in line:
            self.match_ended.emit()

    def stop(self):
        self._running = False


class PickOverlay(QWidget):
    """Full-screen transparent overlay that captures a double-click position."""
    position_picked = pyqtSignal(str, int, int)  # (resource, screen_x, screen_y)

    def __init__(self, resource, parent=None):
        super().__init__(parent)
        self._resource = resource
        self.setWindowFlags(
            Qt.FramelessWindowHint
            | Qt.WindowStaysOnTopHint
            | Qt.Tool
        )
        self.setAttribute(Qt.WA_TranslucentBackground, True)
        self.setCursor(Qt.CrossCursor)
        # Cover entire screen
        screen = QApplication.primaryScreen().geometry()
        self.setGeometry(screen)

    def paintEvent(self, event):
        """Draw a subtle overlay with instruction text."""
        painter = QPainter(self)
        # Very slight dark tint
        painter.fillRect(self.rect(), QColor(0, 0, 0, 25))
        # Draw instruction
        painter.setPen(QPen(QColor(255, 255, 255, 200)))
        painter.setFont(QFont("Segoe UI", 14))
        if self._resource == 'all':
            hint = "Double-click on the FOOD villager count\n(wood/gold/stone will be derived automatically)"
        else:
            hint = f"Double-click on the {self._resource.upper()} villager count"
        painter.drawText(self.rect(), Qt.AlignTop | Qt.AlignHCenter, f"\n  {hint}  ")
        # Draw crosshair at cursor
        pos = self.mapFromGlobal(QCursor.pos())
        painter.setPen(QPen(QColor(41, 224, 248, 180), 1))
        painter.drawLine(pos.x() - 15, pos.y(), pos.x() + 15, pos.y())
        painter.drawLine(pos.x(), pos.y() - 15, pos.x(), pos.y() + 15)
        painter.end()

    def mouseMoveEvent(self, event):
        self.update()  # Repaint crosshair

    def mouseDoubleClickEvent(self, event):
        """Double-click captures the position."""
        if event.button() == Qt.LeftButton:
            gpos = event.globalPos()
            self.position_picked.emit(self._resource, gpos.x(), gpos.y())
            self.close()

    def keyPressEvent(self, event):
        """Esc to cancel."""
        if event.key() == Qt.Key_Escape:
            self.close()

    def showEvent(self, event):
        """Track mouse for crosshair."""
        self.setMouseTracking(True)


class OverlayWebPage(QWebEnginePage):
    """Custom web page that makes the background transparent."""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setBackgroundColor(QColor(0, 0, 0, 0))


class OverlayWindow(QMainWindow):
    FULL_HEIGHT = 560
    COMPACT_HEIGHT = 240

    def __init__(self):
        super().__init__()
        self.click_through = False
        self.opacity_level = 0.92
        self._compact_mode = False
        self._full_geometry = None
        self._page_ready = False
        self._pending_js = []
        self.scanner = ScreenScanner()
        self._pick_overlay = None
        self._ocr_timer = None
        self._ocr_interval = 1000  # ms, default 1s
        self.init_ui()
        self.init_tray()
        self._start_action_polling()
        self._start_log_watcher()

    def init_ui(self):
        self.setWindowTitle("AoE4 Production Overlay")
        self.setWindowFlags(
            Qt.FramelessWindowHint
            | Qt.WindowStaysOnTopHint
            | Qt.Tool
        )
        self.setAttribute(Qt.WA_TranslucentBackground, True)
        self.setWindowOpacity(self.opacity_level)

        screen = QApplication.primaryScreen().geometry()
        width = 340
        x = screen.width() - width - 20
        y = 20
        self.setGeometry(x, y, width, self.FULL_HEIGHT)
        self.setMinimumSize(240, 120)
        self.setMaximumSize(600, 1200)

        self.web_view = QWebEngineView(self)
        page = OverlayWebPage(self.web_view)
        self.web_view.setPage(page)

        settings = self.web_view.settings()
        settings.setAttribute(QWebEngineSettings.LocalContentCanAccessFileUrls, True)
        settings.setAttribute(QWebEngineSettings.JavascriptEnabled, True)

        self.web_view.setStyleSheet("background: transparent;")

        # Support PyInstaller bundled mode
        base_dir = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
        web_dir = os.path.join(base_dir, "web")
        index_path = os.path.join(web_dir, "index.html")
        self.web_view.setUrl(QUrl.fromLocalFile(index_path))
        self.web_view.loadFinished.connect(self._on_page_loaded)

        self.setCentralWidget(self.web_view)
        self._drag_active = False
        self._drag_start_x = 0
        self._drag_start_y = 0
        self._drag_win_x = 0
        self._drag_win_y = 0
        self._resize_active = False
        self._resize_edge = ''
        self._resize_start_x = 0
        self._resize_start_y = 0
        self._resize_start_geo = None

    def _on_page_loaded(self, ok):
        """Called when the web page finishes loading."""
        if ok:
            self._page_ready = True
            for js in self._pending_js:
                self.web_view.page().runJavaScript(js)
            self._pending_js.clear()

    def _run_js(self, js):
        """Run JavaScript, queuing if page not ready yet."""
        if self._page_ready:
            self.web_view.page().runJavaScript(js)
        else:
            self._pending_js.append(js)

    @staticmethod
    def _create_tray_icon():
        """Generate a small AoE4-themed tray icon programmatically."""
        px = QPixmap(32, 32)
        px.fill(QColor(0, 0, 0, 0))
        p = QPainter(px)
        p.setRenderHint(QPainter.Antialiasing)
        # Dark background circle
        p.setBrush(QColor(15, 15, 22, 220))
        p.setPen(QPen(QColor(41, 224, 248, 200), 2))
        p.drawEllipse(2, 2, 28, 28)
        # "IV" text
        p.setPen(QColor(41, 224, 248))
        p.setFont(QFont("Segoe UI", 11, QFont.Bold))
        p.drawText(px.rect(), Qt.AlignCenter, "IV")
        p.end()
        return QIcon(px)

    def init_tray(self):
        self.tray = QSystemTrayIcon(self)
        self.tray.setIcon(self._create_tray_icon())
        self.tray.setToolTip("AoE4 Production Overlay")
        self.tray.activated.connect(self._on_tray_activated)

        menu = QMenu()

        show_action = QAction("Show/Hide", self)
        show_action.triggered.connect(self.toggle_visibility)
        menu.addAction(show_action)

        compact_action = QAction("Compact Mode", self)
        compact_action.triggered.connect(self.toggle_compact_mode)
        menu.addAction(compact_action)

        click_through_action = QAction("Toggle Click-Through", self)
        click_through_action.triggered.connect(self.toggle_click_through)
        menu.addAction(click_through_action)

        menu.addSeparator()

        size_menu = menu.addMenu("Size")
        for width in [280, 340, 420, 500]:
            action = QAction(f"{width}px wide", self)
            action.triggered.connect(lambda checked, w=width: self._set_width(w))
            size_menu.addAction(action)

        opacity_menu = menu.addMenu("Opacity")
        for level in [100, 80, 60, 40]:
            action = QAction(f"{level}%", self)
            action.triggered.connect(lambda checked, l=level: self.set_opacity(l / 100))
            opacity_menu.addAction(action)

        menu.addSeparator()

        quit_action = QAction("Quit", self)
        quit_action.triggered.connect(QApplication.quit)
        menu.addAction(quit_action)

        self.tray.setContextMenu(menu)
        self.tray.show()

    # ---- Log Watcher ----
    def _start_log_watcher(self):
        """Start monitoring the AoE4 log file."""
        self.log_watcher = LogWatcher(self)
        self.log_watcher.steam_id_found.connect(self._on_steam_id_found)
        self.log_watcher.match_started.connect(self._on_match_started)
        self.log_watcher.match_ended.connect(self._on_match_ended)
        self.log_watcher.start()

    def _on_steam_id_found(self, steam_id, steam_name):
        """Auto-configure player identity from log."""
        js_name = steam_name.replace('\\', '\\\\').replace("'", "\\'")
        self._run_js(f"onSteamIdDetected('{steam_id}', '{js_name}');")

    def _on_match_started(self):
        """Match detected in log - notify frontend to start polling."""
        self._run_js("onMatchDetected();")

    def _on_match_ended(self):
        """Match ended - refresh data for final results."""
        self._run_js("onMatchEnded();")

    # ---- Tray & Window ----
    def _on_tray_activated(self, reason):
        """Double-click tray icon to show window."""
        if reason == QSystemTrayIcon.DoubleClick:
            self.show()
            self.activateWindow()

    def _start_action_polling(self):
        """Poll for actions from the web UI (compact, minimize, close, drag)."""
        self._poll_timer = QTimer(self)
        self._poll_timer.timeout.connect(self._poll_web_actions)
        self._poll_timer.start(16)  # ~60fps for smooth drag
        self._last_action_ts = 0

    def _poll_web_actions(self):
        self.web_view.page().runJavaScript(
            "window._pyqtAction ? JSON.stringify(window._pyqtAction) : null",
            self._handle_web_action
        )

    def _handle_web_action(self, result):
        if not result:
            return
        import json
        try:
            action = json.loads(result)
        except (json.JSONDecodeError, TypeError):
            return

        ts = action.get('ts', 0)
        if ts <= self._last_action_ts:
            return
        self._last_action_ts = ts

        act = action.get('action')
        if act == 'minimize':
            self.hide()
        elif act == 'close':
            QApplication.quit()
        elif act == 'compactMode':
            is_compact = action.get('data', False)
            self._apply_compact_mode(is_compact)
        elif act == 'dragStart':
            data = action.get('data', {})
            self._drag_active = True
            self._drag_start_x = data.get('screenX', 0)
            self._drag_start_y = data.get('screenY', 0)
            geo = self.geometry()
            self._drag_win_x = geo.x()
            self._drag_win_y = geo.y()
        elif act == 'dragMove':
            if self._drag_active:
                data = action.get('data', {})
                dx = data.get('screenX', 0) - self._drag_start_x
                dy = data.get('screenY', 0) - self._drag_start_y
                self.move(self._drag_win_x + dx, self._drag_win_y + dy)
        elif act == 'dragEnd':
            self._drag_active = False
        elif act == 'resizeStart':
            data = action.get('data', {})
            self._resize_active = True
            self._resize_edge = data.get('edge', '')
            self._resize_start_x = data.get('screenX', 0)
            self._resize_start_y = data.get('screenY', 0)
            self._resize_start_geo = self.geometry()
        elif act == 'resizeMove':
            if getattr(self, '_resize_active', False):
                data = action.get('data', {})
                dx = data.get('screenX', 0) - self._resize_start_x
                dy = data.get('screenY', 0) - self._resize_start_y
                geo = self._resize_start_geo
                x, y, w, h = geo.x(), geo.y(), geo.width(), geo.height()
                edge = self._resize_edge
                if 'right' in edge:
                    w = max(self.minimumWidth(), min(self.maximumWidth(), geo.width() + dx))
                if 'left' in edge:
                    nw = max(self.minimumWidth(), min(self.maximumWidth(), geo.width() - dx))
                    x = geo.x() + geo.width() - nw
                    w = nw
                if 'bottom' in edge:
                    h = max(self.minimumHeight(), min(self.maximumHeight(), geo.height() + dy))
                self.setGeometry(x, y, w, h)
        elif act == 'resizeEnd':
            self._resize_active = False
            self._resize_edge = ''
        elif act == 'ocrPick':
            resource = action.get('data', 'food')
            self._start_ocr_pick(resource)
        elif act == 'ocrScanAll':
            self._ocr_scan_all()
        elif act == 'ocrAutoToggle':
            enabled = action.get('data', False)
            self._toggle_ocr_auto(enabled)
        elif act == 'ocrSetInterval':
            ms = int(action.get('data', 1000))
            self._ocr_interval = max(200, min(5000, ms))
            if self._ocr_timer and self._ocr_timer.isActive():
                self._ocr_timer.setInterval(self._ocr_interval)

    def _apply_compact_mode(self, compact):
        self._compact_mode = compact
        geo = self.geometry()
        if compact:
            self._full_geometry = self.geometry()
            self.setGeometry(geo.x(), geo.y(), geo.width(), self.COMPACT_HEIGHT)
        else:
            if self._full_geometry:
                self.setGeometry(geo.x(), geo.y(), geo.width(), self._full_geometry.height())
            else:
                self.setGeometry(geo.x(), geo.y(), geo.width(), self.FULL_HEIGHT)

    def toggle_visibility(self):
        if self.isVisible():
            self.hide()
        else:
            self.show()
            self.activateWindow()

    def toggle_compact_mode(self):
        self._compact_mode = not self._compact_mode
        self.web_view.page().runJavaScript("toggleCompactMode();")
        self._apply_compact_mode(self._compact_mode)

    def toggle_click_through(self):
        self.click_through = not self.click_through
        if self.click_through:
            self.setWindowFlags(self.windowFlags() | Qt.WindowTransparentForInput)
        else:
            self.setWindowFlags(self.windowFlags() & ~Qt.WindowTransparentForInput)
        self.show()

    def _set_width(self, width):
        geo = self.geometry()
        self.setGeometry(geo.x(), geo.y(), width, geo.height())

    def set_opacity(self, level):
        self.opacity_level = level
        self.setWindowOpacity(level)

    # ---- OCR Pick Mode ----
    def _start_ocr_pick(self, resource):
        """Show fullscreen overlay for user to double-click on the number."""
        if self._pick_overlay:
            self._pick_overlay.close()
        self._pick_overlay = PickOverlay(resource)
        self._pick_overlay.position_picked.connect(self._on_position_picked)
        self._pick_overlay.show()

    def _on_position_picked(self, resource, sx, sy):
        """User double-clicked on screen. Hide pick overlay, wait briefly, then capture."""
        self._pick_overlay = None
        self._pick_resource = resource
        self._pick_x = sx
        self._pick_y = sy
        # Wait 100ms for pick overlay to fully disappear before capturing
        QTimer.singleShot(100, self._do_ocr_capture)

    def _do_ocr_capture(self):
        """Capture at the picked position."""
        resource = self._pick_resource
        x, y = self._pick_x, self._pick_y

        if resource == 'all':
            # "Pick All" mode: user clicked the food number, derive all 4
            self.scanner.set_anchor(x, y)
            self._ocr_scan_all()
        else:
            # Single resource pick: save individual position and read just that one
            self.scanner.save_single_position(resource, x, y)
            val, conf, preview = self.scanner.read_single(x, y)
            val_js = val if val is not None else 'null'
            self._run_js(f"onOCRResult('{resource}', {val_js}, {conf:.2f}, null);")

    def _ocr_scan_all(self):
        """Read all positions at once (anchor-based or individual overrides)."""
        results = self.scanner.read_all()
        for res, (val, conf) in results.items():
            val_js = val if val is not None else 'null'
            self._run_js(f"onOCRResult('{res}', {val_js}, {conf:.2f}, null);")

    def _toggle_ocr_auto(self, enabled):
        """Start or stop the auto-refresh OCR timer."""
        if enabled and self.scanner.has_saved_positions:
            if not self._ocr_timer:
                self._ocr_timer = QTimer(self)
                self._ocr_timer.timeout.connect(self._ocr_scan_all)
            self._ocr_timer.start(self._ocr_interval)
        else:
            if self._ocr_timer:
                self._ocr_timer.stop()

    def resizeEvent(self, event):
        super().resizeEvent(event)
        w = event.size().width()
        h = event.size().height()
        if self._page_ready:
            self.web_view.page().runJavaScript(f"onWindowResize({w}, {h});")

    def closeEvent(self, event):
        if self.log_watcher:
            self.log_watcher.stop()
            self.log_watcher.wait(2000)
        event.accept()


def main():
    app = QApplication(sys.argv)
    app.setQuitOnLastWindowClosed(False)

    window = OverlayWindow()
    app.setWindowIcon(window._create_tray_icon())
    window.show()

    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
