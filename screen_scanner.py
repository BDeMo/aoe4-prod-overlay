"""
Screen Scanner for AoE4 Production Queue
Captures a screen region and uses OpenCV template matching
to detect unit icons in the production queue.
"""

import os
import json
import base64
import time
import numpy as np

try:
    import mss
    import cv2
    HAS_DEPS = True
except ImportError:
    HAS_DEPS = False


CONFIG_DIR = os.path.expanduser(r"~\Documents\My Games\Age of Empires IV")
TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ocr_templates")
CONFIG_FILE = os.path.join(CONFIG_DIR, "overlay_ocr_config.json")

# Default scan region (bottom-center of 1920x1080)
DEFAULT_REGION = {"x": 700, "y": 920, "w": 520, "h": 80}
MATCH_THRESHOLD = 0.78
SCAN_INTERVAL_MS = 1000


class ScreenScanner:
    """Captures screen region and matches unit icon templates."""

    def __init__(self):
        self.enabled = False
        self.region = dict(DEFAULT_REGION)
        self.templates = {}  # {unit_id: cv2_image}
        self.last_capture = None  # raw numpy array
        self.last_results = []  # [{unit_id, confidence, x, y}]
        self._sct = None

        if HAS_DEPS:
            self._sct = mss.mss()
            self._load_config()
            self._load_templates()

    def _load_config(self):
        """Load scan region from config file."""
        try:
            if os.path.exists(CONFIG_FILE):
                with open(CONFIG_FILE, 'r') as f:
                    data = json.load(f)
                    if 'region' in data:
                        self.region.update(data['region'])
                    self.enabled = data.get('enabled', False)
        except Exception:
            pass

    def save_config(self):
        """Save scan region to config file."""
        try:
            os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
            with open(CONFIG_FILE, 'w') as f:
                json.dump({
                    'region': self.region,
                    'enabled': self.enabled
                }, f, indent=2)
        except Exception:
            pass

    def _load_templates(self):
        """Load unit icon templates from ocr_templates/ folder."""
        self.templates = {}
        if not os.path.exists(TEMPLATES_DIR):
            os.makedirs(TEMPLATES_DIR, exist_ok=True)
            return

        for fname in os.listdir(TEMPLATES_DIR):
            if fname.endswith(('.png', '.jpg', '.bmp')):
                unit_id = os.path.splitext(fname)[0].upper()
                path = os.path.join(TEMPLATES_DIR, fname)
                img = cv2.imread(path, cv2.IMREAD_COLOR)
                if img is not None:
                    self.templates[unit_id] = img

    def set_region(self, x, y, w, h):
        """Update capture region."""
        self.region = {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}
        self.save_config()

    def capture(self):
        """Capture the configured screen region. Returns numpy array (BGR)."""
        if not HAS_DEPS or not self._sct:
            return None

        monitor = {
            "left": self.region["x"],
            "top": self.region["y"],
            "width": self.region["w"],
            "height": self.region["h"]
        }

        try:
            screenshot = self._sct.grab(monitor)
            img = np.array(screenshot)[:, :, :3]  # BGRA -> BGR
            self.last_capture = img
            return img
        except Exception:
            return None

    def scan(self):
        """Capture screen and match templates. Returns list of detected units."""
        img = self.capture()
        if img is None:
            return []

        results = []
        if not self.templates:
            self.last_results = results
            return results

        gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        for unit_id, template in self.templates.items():
            gray_tpl = cv2.cvtColor(template, cv2.COLOR_BGR2GRAY)
            th, tw = gray_tpl.shape[:2]

            # Skip if template is bigger than capture
            if th > gray_img.shape[0] or tw > gray_img.shape[1]:
                continue

            result = cv2.matchTemplate(gray_img, gray_tpl, cv2.TM_CCOEFF_NORMED)
            locations = np.where(result >= MATCH_THRESHOLD)

            for pt_y, pt_x in zip(*locations):
                # Check for duplicate detections (nearby matches)
                is_dup = False
                for r in results:
                    if r['unit_id'] == unit_id and abs(r['x'] - pt_x) < tw * 0.5:
                        if result[pt_y, pt_x] > r['confidence']:
                            r['x'] = int(pt_x)
                            r['y'] = int(pt_y)
                            r['confidence'] = float(result[pt_y, pt_x])
                        is_dup = True
                        break
                if not is_dup:
                    results.append({
                        'unit_id': unit_id,
                        'x': int(pt_x),
                        'y': int(pt_y),
                        'confidence': float(result[pt_y, pt_x])
                    })

        # Sort by x position (left to right = production order)
        results.sort(key=lambda r: r['x'])
        self.last_results = results
        return results

    def get_capture_base64(self, max_width=300):
        """Get last capture as base64 JPEG for UI preview."""
        if self.last_capture is None:
            return None

        img = self.last_capture
        # Resize for preview
        h, w = img.shape[:2]
        if w > max_width:
            scale = max_width / w
            img = cv2.resize(img, (max_width, int(h * scale)))

        _, buf = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 70])
        return base64.b64encode(buf).decode('utf-8')

    def save_template_from_capture(self, unit_id, x, y, w, h):
        """Crop a region from last capture and save as template."""
        if self.last_capture is None:
            return False

        crop = self.last_capture[y:y+h, x:x+w]
        if crop.size == 0:
            return False

        os.makedirs(TEMPLATES_DIR, exist_ok=True)
        path = os.path.join(TEMPLATES_DIR, f"{unit_id.lower()}.png")
        cv2.imwrite(path, crop)

        # Reload templates
        self._load_templates()
        return True

    @property
    def has_deps(self):
        return HAS_DEPS

    @property
    def template_count(self):
        return len(self.templates)

    @property
    def template_names(self):
        return list(self.templates.keys())
