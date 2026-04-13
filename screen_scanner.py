"""
Screen Scanner for AoE4 Overlay
Captures the villager count panel from screen and reads resource villager
numbers using OpenCV.

Two modes:
  1. "Pick All": User double-clicks on the FOOD number. Wood/gold/stone
     positions are derived by fixed vertical offsets.
  2. "Pick Single": User double-clicks on a specific resource number.
     That position is saved individually and overrides the anchor offset.
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

# Per-number capture: wide enough for "199", tall enough for one row
NUM_W = 80
NUM_H = 32

# Vertical spacing between resource rows in AoE4 UI (1080p default)
ROW_SPACING = 32

# Resource order top to bottom
RESOURCES = ['food', 'wood', 'gold', 'stone']


class ScreenScanner:
    """Captures AoE4 villager panel and reads resource counts."""

    def __init__(self):
        self.enabled = False
        self._sct = None
        self._anchor = None           # (x, y) of food number center
        self._overrides = {}           # {'wood': (x, y), ...} individual overrides
        self._row_spacing = ROW_SPACING

        if HAS_DEPS:
            self._sct = mss.mss()
            self._load_config()

    # ---- Config persistence ----

    def _load_config(self):
        try:
            if os.path.exists(CONFIG_FILE):
                with open(CONFIG_FILE, 'r') as f:
                    data = json.load(f)
                    self.enabled = data.get('enabled', False)
                    anchor = data.get('anchor')
                    if anchor and len(anchor) == 2:
                        self._anchor = tuple(anchor)
                    self._overrides = data.get('overrides', {})
                    self._row_spacing = data.get('row_spacing', ROW_SPACING)
        except Exception:
            pass

    def save_config(self):
        try:
            os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
            with open(CONFIG_FILE, 'w') as f:
                json.dump({
                    'enabled': self.enabled,
                    'anchor': list(self._anchor) if self._anchor else None,
                    'overrides': self._overrides,
                    'row_spacing': self._row_spacing
                }, f, indent=2)
        except Exception:
            pass

    # ---- Position management ----

    def set_anchor(self, x, y):
        """Set the anchor (food number center). Clears individual overrides."""
        self._anchor = (int(x), int(y))
        self._overrides = {}
        self.save_config()

    def save_single_position(self, resource, x, y):
        """Save an individual position override for a single resource."""
        self._overrides[resource] = [int(x), int(y)]
        # If no anchor yet, infer it from this resource
        if self._anchor is None:
            idx = RESOURCES.index(resource) if resource in RESOURCES else 0
            self._anchor = (int(x), int(y) - idx * self._row_spacing)
        self.save_config()

    def _get_positions(self):
        """Get screen positions for all 4 resources."""
        positions = {}
        if not self._anchor and not self._overrides:
            return positions
        ax, ay = self._anchor or (0, 0)
        for i, res in enumerate(RESOURCES):
            if res in self._overrides:
                positions[res] = tuple(self._overrides[res])
            elif self._anchor:
                positions[res] = (ax, ay + i * self._row_spacing)
        return positions

    # ---- Capture ----

    def capture_at(self, cx, cy, w=None, h=None):
        """Capture screen region centered at (cx, cy). Returns BGR numpy array."""
        if not HAS_DEPS or not self._sct:
            return None
        w = w or NUM_W
        h = h or NUM_H
        x = max(0, cx - w // 2)
        y = max(0, cy - h // 2)
        monitor = {"left": x, "top": y, "width": w, "height": h}
        try:
            screenshot = self._sct.grab(monitor)
            return np.array(screenshot)[:, :, :3]
        except Exception:
            return None

    # ---- Read ----

    def read_all(self):
        """Read all 4 resource villager counts.
        Returns dict: {'food': (val, conf), ...}"""
        positions = self._get_positions()
        results = {}
        for res in RESOURCES:
            if res in positions:
                x, y = positions[res]
                img = self.capture_at(x, y)
                if img is not None:
                    val, conf = self._read_number(img)
                    results[res] = (val, conf)
                else:
                    results[res] = (None, 0.0)
            else:
                results[res] = (None, 0.0)
        return results

    def read_single(self, cx, cy):
        """Read number at a single screen position.
        Returns (value, confidence, preview_b64)."""
        img = self.capture_at(cx, cy)
        if img is None:
            return None, 0.0, None
        preview = self._img_to_base64(img)
        val, conf = self._read_number(img)
        return val, conf, preview

    # Legacy compat
    def read_all_saved(self):
        return self.read_all()

    def save_position(self, resource, x, y):
        self.save_single_position(resource, x, y)

    # ---- OCR Engine ----

    def _read_number(self, img):
        """Extract number from BGR image. Tries multiple thresholds.
        Returns (number: int|None, confidence: float)."""
        if not HAS_DEPS:
            return None, 0.0

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Upscale small captures for better digit segmentation
        if gray.shape[1] < 100:
            scale = 2
            gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

        results = []
        for binary in self._make_binaries(gray):
            val, conf = self._ocr_from_binary(binary)
            if val is not None:
                results.append((val, conf))

        if not results:
            return None, 0.0
        results.sort(key=lambda r: r[1], reverse=True)
        return results[0]

    def _make_binaries(self, gray):
        """Generate multiple binarized versions for robust OCR."""
        out = []

        # Otsu
        _, b = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        if np.sum(b > 0) / b.size > 0.5:
            b = cv2.bitwise_not(b)
        out.append(b)

        # Fixed thresholds for bright-on-dark game text
        for t in [120, 150, 180, 200]:
            _, b = cv2.threshold(gray, t, 255, cv2.THRESH_BINARY)
            out.append(b)

        # Adaptive
        b = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY, 15, -4)
        out.append(b)

        return out

    def _ocr_from_binary(self, binary):
        """OCR a binary image. Returns (number, confidence)."""
        # Clean up noise
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)

        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        h_img = binary.shape[0]
        min_h = h_img * 0.25
        digit_regions = []
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            if h >= min_h and w >= 3 and h >= 8:
                # Filter noise: aspect ratio check
                aspect = w / max(h, 1)
                if aspect < 1.5:
                    digit_regions.append((x, y, w, h))

        if not digit_regions:
            return None, 0.0

        digit_regions.sort(key=lambda r: r[0])

        # Merge overlapping / very close
        merged = [list(digit_regions[0])]
        for r in digit_regions[1:]:
            prev = merged[-1]
            gap = r[0] - (prev[0] + prev[2])
            if gap < 4:  # overlapping or very close
                x = min(prev[0], r[0])
                y = min(prev[1], r[1])
                x2 = max(prev[0] + prev[2], r[0] + r[2])
                y2 = max(prev[1] + prev[3], r[1] + r[3])
                merged[-1] = [x, y, x2 - x, y2 - y]
            else:
                merged.append(list(r))

        if len(merged) > 3:
            return None, 0.0

        # Recognize digits
        digits = []
        total_conf = 0
        for (x, y, w, h) in merged:
            roi = binary[y:y+h, x:x+w]
            aspect = w / max(h, 1)

            # Wide ROI? Likely multiple digits fused together
            if aspect > 0.7 and w > 15:
                sub_digits = self._split_and_match(roi)
                if sub_digits:
                    for d, c in sub_digits:
                        digits.append(d)
                        total_conf += c
                    continue

            d, c = self._match_single_digit(roi)
            if d is not None:
                digits.append(d)
                total_conf += c

        if not digits:
            return None, 0.0

        number = int(''.join(str(d) for d in digits))
        if number > 200:
            return None, 0.0
        avg_conf = total_conf / max(len(digits), 1)
        return number, avg_conf

    def _split_and_match(self, roi):
        """Try to split a wide ROI into individual digits using vertical projection."""
        h, w = roi.shape[:2]
        if w < 10:
            return None

        # Vertical projection: count white pixels per column
        proj = np.sum(roi > 0, axis=0)

        # Find valleys (gaps between digits)
        threshold = max(1, h * 0.1)
        in_digit = False
        segments = []
        start = 0
        for i in range(w):
            if proj[i] > threshold:
                if not in_digit:
                    start = i
                    in_digit = True
            else:
                if in_digit:
                    segments.append((start, i))
                    in_digit = False
        if in_digit:
            segments.append((start, w))

        if len(segments) < 2:
            # No clear split found — try even split
            n = max(2, round(w / (h * 0.55)))  # estimate digit count from width/height
            n = min(n, 3)
            seg_w = w // n
            segments = [(i * seg_w, min((i + 1) * seg_w, w)) for i in range(n)]

        results = []
        for (x1, x2) in segments:
            if x2 - x1 < 3:
                continue
            digit_roi = roi[:, x1:x2]
            d, c = self._match_single_digit(digit_roi)
            if d is not None:
                results.append((d, c))

        return results if results else None

    def _match_single_digit(self, roi):
        """Match a ROI against digit templates 0-9.
        Returns (digit, confidence)."""
        if roi.size == 0 or roi.shape[0] < 4 or roi.shape[1] < 2:
            return None, 0.0

        std_h, std_w = 24, 14
        try:
            resized = cv2.resize(roi, (std_w, std_h), interpolation=cv2.INTER_AREA)
        except Exception:
            return None, 0.0

        best_digit = None
        best_score = 0.30

        for d, tpl in self._get_digit_templates().items():
            result = cv2.matchTemplate(resized, tpl, cv2.TM_CCOEFF_NORMED)
            score = float(result[0][0]) if result.size > 0 else 0
            if score > best_score:
                best_score = score
                best_digit = d

        return best_digit, best_score

    _cached_templates = None

    def _get_digit_templates(self):
        """Generate and cache digit templates 0-9."""
        if ScreenScanner._cached_templates is not None:
            return ScreenScanner._cached_templates

        if not HAS_DEPS:
            return {}

        templates = {}
        std_h, std_w = 24, 14
        fonts = [
            cv2.FONT_HERSHEY_SIMPLEX,
            cv2.FONT_HERSHEY_DUPLEX,
            cv2.FONT_HERSHEY_COMPLEX,
        ]
        for d in range(10):
            best_tpl = None
            best_pixels = 0
            for font in fonts:
                for scale in [0.55, 0.65, 0.75, 0.85]:
                    for thickness in [1, 2]:
                        (tw, th), baseline = cv2.getTextSize(str(d), font, scale, thickness)
                        img = np.zeros((th + baseline + 8, tw + 8), dtype=np.uint8)
                        cv2.putText(img, str(d), (4, th + 4), font, scale, 255, thickness)
                        coords = cv2.findNonZero(img)
                        if coords is not None:
                            x, y, w, h = cv2.boundingRect(coords)
                            crop = img[y:y+h, x:x+w]
                            if crop.size > 0:
                                tpl = cv2.resize(crop, (std_w, std_h), interpolation=cv2.INTER_AREA)
                                px = int(np.sum(tpl > 0))
                                if px > best_pixels:
                                    best_pixels = px
                                    best_tpl = tpl
            if best_tpl is not None:
                templates[d] = best_tpl

        ScreenScanner._cached_templates = templates
        return templates

    def _img_to_base64(self, img, max_width=200):
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
        return self._anchor is not None or len(self._overrides) > 0
