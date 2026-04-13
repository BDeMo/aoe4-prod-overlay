"""
Screen Scanner for AoE4 Overlay
Captures a small screen region around a given point and reads digit(s) using
OpenCV template matching with auto-generated digit templates.
"""

import os
import json
import base64
import numpy as np

try:
    import mss
    import cv2
    HAS_DEPS = True
except ImportError:
    HAS_DEPS = False


CONFIG_DIR = os.path.expanduser(r"~\Documents\My Games\Age of Empires IV")
CONFIG_FILE = os.path.join(CONFIG_DIR, "overlay_ocr_config.json")

# Capture region size around cursor
CAPTURE_W = 60
CAPTURE_H = 28

# Digit matching threshold
DIGIT_THRESHOLD = 0.55


class ScreenScanner:
    """Captures screen near cursor and reads numbers via digit template matching."""

    def __init__(self):
        self.enabled = False
        self._sct = None
        self._digit_templates = {}  # {digit_int: [template_imgs]}
        self._saved_positions = {}  # {'food': (x,y), 'wood': (x,y), ...}

        if HAS_DEPS:
            self._sct = mss.mss()
            self._generate_digit_templates()
            self._load_config()

    def _load_config(self):
        try:
            if os.path.exists(CONFIG_FILE):
                with open(CONFIG_FILE, 'r') as f:
                    data = json.load(f)
                    self.enabled = data.get('enabled', False)
                    self._saved_positions = data.get('positions', {})
        except Exception:
            pass

    def save_config(self):
        try:
            os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
            with open(CONFIG_FILE, 'w') as f:
                json.dump({
                    'enabled': self.enabled,
                    'positions': self._saved_positions
                }, f, indent=2)
        except Exception:
            pass

    def _generate_digit_templates(self):
        """Generate digit templates 0-9 using OpenCV text rendering.
        Multiple font scales and styles for robustness."""
        if not HAS_DEPS:
            return

        self._digit_templates = {}
        fonts = [
            cv2.FONT_HERSHEY_SIMPLEX,
            cv2.FONT_HERSHEY_DUPLEX,
        ]
        scales = [0.5, 0.55, 0.6, 0.65, 0.7]

        for d in range(10):
            templates = []
            for font in fonts:
                for scale in scales:
                    thickness = 1 if scale < 0.6 else 2
                    (tw, th), baseline = cv2.getTextSize(str(d), font, scale, thickness)
                    img = np.zeros((th + baseline + 4, tw + 4), dtype=np.uint8)
                    cv2.putText(img, str(d), (2, th + 2), font, scale, 255, thickness)
                    # Crop tight
                    coords = cv2.findNonZero(img)
                    if coords is not None:
                        x, y, w, h = cv2.boundingRect(coords)
                        img = img[y:y+h, x:x+w]
                    if img.size > 0:
                        templates.append(img)
            self._digit_templates[d] = templates

    def save_position(self, resource, x, y):
        """Save a screen coordinate for a resource."""
        self._saved_positions[resource] = [int(x), int(y)]
        self.save_config()

    def get_saved_positions(self):
        return dict(self._saved_positions)

    def capture_at(self, cx, cy, w=None, h=None):
        """Capture a screen region centered at (cx, cy). Returns BGR numpy array."""
        if not HAS_DEPS or not self._sct:
            return None

        w = w or CAPTURE_W
        h = h or CAPTURE_H
        x = max(0, cx - w // 2)
        y = max(0, cy - h // 2)

        monitor = {"left": x, "top": y, "width": w, "height": h}
        try:
            screenshot = self._sct.grab(monitor)
            img = np.array(screenshot)[:, :, :3]  # BGRA -> BGR
            return img
        except Exception:
            return None

    def read_number_at(self, cx, cy):
        """Capture around (cx, cy) and try to read a number.
        Returns (value: int|None, confidence: float, preview_b64: str|None)."""
        img = self.capture_at(cx, cy)
        if img is None:
            return None, 0.0, None

        preview = self._img_to_base64(img)
        value, confidence = self._read_digits(img)
        return value, confidence, preview

    def read_all_saved(self):
        """Read numbers at all saved positions.
        Returns dict: {'food': (value, conf), 'wood': (value, conf), ...}."""
        results = {}
        for res, (x, y) in self._saved_positions.items():
            val, conf, _ = self.read_number_at(x, y)
            results[res] = (val, conf)
        return results

    def _read_digits(self, img):
        """Extract a number from a BGR image using digit template matching.
        Returns (number: int|None, confidence: float)."""
        if not HAS_DEPS:
            return None, 0.0

        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Adaptive threshold — game text is bright on dark
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # Check if we need to invert (digits should be white)
        white_ratio = np.sum(binary > 0) / binary.size
        if white_ratio > 0.5:
            binary = cv2.bitwise_not(binary)

        # Find contours for digit segmentation
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Filter contours: keep digit-sized ones
        h_img = binary.shape[0]
        digit_regions = []
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            aspect = w / max(h, 1)
            # Digit should be at least ~30% of image height, reasonable aspect ratio
            if h >= h_img * 0.25 and 0.15 < aspect < 1.2 and w >= 3 and h >= 6:
                digit_regions.append((x, y, w, h))

        if not digit_regions:
            return None, 0.0

        # Sort by x (left to right)
        digit_regions.sort(key=lambda r: r[0])

        # Merge overlapping/nearby regions (some digits have split contours like '1')
        merged = [digit_regions[0]]
        for r in digit_regions[1:]:
            prev = merged[-1]
            if r[0] < prev[0] + prev[2] + 2:  # overlapping or very close
                # Merge
                x = min(prev[0], r[0])
                y = min(prev[1], r[1])
                x2 = max(prev[0] + prev[2], r[0] + r[2])
                y2 = max(prev[1] + prev[3], r[1] + r[3])
                merged[-1] = (x, y, x2 - x, y2 - y)
            else:
                merged.append(r)

        # Recognize each digit
        digits = []
        total_conf = 0
        for (x, y, w, h) in merged:
            roi = binary[y:y+h, x:x+w]
            best_digit, best_score = self._match_digit(roi)
            if best_digit is not None:
                digits.append(best_digit)
                total_conf += best_score

        if not digits:
            return None, 0.0

        # Build number
        number = int(''.join(str(d) for d in digits))
        avg_conf = total_conf / len(digits)
        return number, avg_conf

    def _match_digit(self, roi):
        """Match a single digit ROI against templates.
        Returns (digit: int|None, confidence: float)."""
        best_digit = None
        best_score = DIGIT_THRESHOLD

        for d, templates in self._digit_templates.items():
            for tpl in templates:
                # Resize ROI to match template size
                try:
                    resized = cv2.resize(roi, (tpl.shape[1], tpl.shape[0]),
                                         interpolation=cv2.INTER_AREA)
                except Exception:
                    continue

                result = cv2.matchTemplate(resized, tpl, cv2.TM_CCOEFF_NORMED)
                score = result[0][0] if result.size > 0 else 0

                if score > best_score:
                    best_score = score
                    best_digit = d

        return best_digit, best_score

    def _img_to_base64(self, img, max_width=200):
        """Encode image as base64 JPEG for UI preview."""
        h, w = img.shape[:2]
        if w > max_width:
            scale = max_width / w
            img = cv2.resize(img, (max_width, int(h * scale)))
        _, buf = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 75])
        return base64.b64encode(buf).decode('utf-8')

    @property
    def has_deps(self):
        return HAS_DEPS

    @property
    def has_saved_positions(self):
        return len(self._saved_positions) > 0
