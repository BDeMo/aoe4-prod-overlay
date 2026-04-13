"""
AoE4 Production Overlay
A floating, semi-transparent overlay that calculates villager requirements
for unit production in Age of Empires IV.
"""

import sys
import os
from PyQt5.QtWidgets import QApplication, QMainWindow, QSystemTrayIcon, QMenu, QAction
from PyQt5.QtCore import Qt, QUrl, QTimer
from PyQt5.QtGui import QIcon, QColor
from PyQt5.QtWebEngineWidgets import QWebEngineView, QWebEnginePage, QWebEngineSettings


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
        self.init_ui()
        self.init_tray()
        self._start_action_polling()

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

        self.setCentralWidget(self.web_view)
        self._drag_pos = None

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


def main():
    app = QApplication(sys.argv)
    app.setQuitOnLastWindowClosed(False)

    window = OverlayWindow()
    window.show()

    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
