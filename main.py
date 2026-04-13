"""
AoE4 Production Overlay
A floating, semi-transparent overlay that calculates villager requirements
for unit production in Age of Empires IV.
"""

import sys
import os
import re
import time
from PyQt5.QtWidgets import QApplication, QMainWindow, QSystemTrayIcon, QMenu, QAction
from PyQt5.QtCore import Qt, QUrl, QTimer, QThread, pyqtSignal
from PyQt5.QtGui import QIcon, QColor
from PyQt5.QtWebEngineWidgets import QWebEngineView, QWebEnginePage, QWebEngineSettings


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
        self.setMinimumSize(280, 120)

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
        self._drag_pos = None

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

    def init_tray(self):
        self.tray = QSystemTrayIcon(self)
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
        """Poll for actions from the web UI (compact, minimize, close)."""
        self._poll_timer = QTimer(self)
        self._poll_timer.timeout.connect(self._poll_web_actions)
        self._poll_timer.start(200)
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

    def set_opacity(self, level):
        self.opacity_level = level
        self.setWindowOpacity(level)

    def closeEvent(self, event):
        if self.log_watcher:
            self.log_watcher.stop()
            self.log_watcher.wait(2000)
        event.accept()


def main():
    app = QApplication(sys.argv)
    app.setQuitOnLastWindowClosed(False)

    window = OverlayWindow()
    window.show()

    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
