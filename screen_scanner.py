"""
Screen Scanner for AoE4 Overlay
Reads villager counts from the AoE4 in-game resource panel.

User drags a region → saved → periodically re-capture that exact region
and OCR the white numbers using AlexNet CNN (ONNX).

Two modes:
  - "Pick All": user drags a region covering all 4 resource rows.
    Split into 4 equal rows (food/wood/gold/stone top-to-bottom).
  - "Pick Single": user drags a region for one resource number.
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

try:
    import onnxruntime as ort
    HAS_ORT = True
except ImportError:
    HAS_ORT = False

CONFIG_DIR = os.path.expanduser(r"~\Documents\My Games\Age of Empires IV")
CONFIG_FILE = os.path.join(CONFIG_DIR, "overlay_ocr_config.json")

RESOURCES = ['food', 'wood', 'gold', 'stone']

# AlexNet uses 32x32 input, MNIST normalization
INPUT_SIZE = 32
MNIST_MEAN = 0.1307
MNIST_STD = 0.3081


class ScreenScanner:
    """Reads AoE4 villager counts by capturing saved screen regions."""

    def __init__(self):
        self.enabled = False
        self._sct = None
        self._all_region = None       # (x, y, w, h) covering all 4 rows
        self._single_regions = {}     # {'food': (x,y,w,h), ...}
        self._ort_session = None
        # Named OCR position presets:
        # {name: {'all_region': (x,y,w,h)|None, 'single_regions': {res:(x,y,w,h)}}}
        self._presets = {}
        self._default_preset = None   # name of preset to auto-load on startup

        if HAS_DEPS:
            self._sct = mss.mss()
        self._load_config()
        self._load_model()

    # ---- ONNX Model ----

    def _load_model(self):
        if not HAS_ORT:
            return
        model_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), 'digit_model.onnx')
        if os.path.exists(model_path):
            try:
                self._ort_session = ort.InferenceSession(
                    model_path, providers=['CPUExecutionProvider'])
            except Exception as e:
                print(f"[OCR] Failed to load model: {e}")

    def _classify_digit(self, img_32x32):
        """Classify a 32x32 grayscale digit image. Returns (digit, confidence)."""
        if self._ort_session is None:
            return None, 0.0
        arr = img_32x32.astype(np.float32) / 255.0
        arr = (arr - MNIST_MEAN) / MNIST_STD
        arr = arr.reshape(1, 1, INPUT_SIZE, INPUT_SIZE)
        outputs = self._ort_session.run(None, {'input': arr})[0]
        exp = np.exp(outputs[0] - np.max(outputs[0]))
        probs = exp / exp.sum()
        digit = int(np.argmax(probs))
        return digit, float(probs[digit])

    # ---- Config ----

    def _load_config(self):
        try:
            if os.path.exists(CONFIG_FILE):
                with open(CONFIG_FILE, 'r') as f:
                    data = json.load(f)
                    self.enabled = data.get('enabled', False)
                    ar = data.get('all_region')
                    if ar and len(ar) == 4:
                        self._all_region = tuple(ar)
                    sr = data.get('single_regions')
                    if sr and isinstance(sr, dict):
                        self._single_regions = {
                            k: tuple(v) for k, v in sr.items()
                            if k in RESOURCES and len(v) == 4
                        }
                    presets = data.get('presets')
                    if isinstance(presets, dict):
                        for name, p in presets.items():
                            if not isinstance(p, dict):
                                continue
                            parsed = {'all_region': None, 'single_regions': {}}
                            par = p.get('all_region')
                            if par and len(par) == 4:
                                parsed['all_region'] = tuple(par)
                            psr = p.get('single_regions')
                            if isinstance(psr, dict):
                                parsed['single_regions'] = {
                                    k: tuple(v) for k, v in psr.items()
                                    if k in RESOURCES and len(v) == 4
                                }
                            self._presets[str(name)] = parsed
                    dp = data.get('default_preset')
                    if isinstance(dp, str) and dp in self._presets:
                        self._default_preset = dp
                        # Auto-load default preset as current region on startup
                        self._apply_preset_data(self._presets[dp])
        except Exception:
            pass

    def save_config(self):
        try:
            os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
            with open(CONFIG_FILE, 'w') as f:
                json.dump({
                    'enabled': self.enabled,
                    'all_region': list(self._all_region) if self._all_region else None,
                    'single_regions': {
                        k: list(v) for k, v in self._single_regions.items()
                    } if self._single_regions else None,
                    'presets': {
                        name: {
                            'all_region': list(p['all_region']) if p.get('all_region') else None,
                            'single_regions': {
                                k: list(v) for k, v in p.get('single_regions', {}).items()
                            },
                        } for name, p in self._presets.items()
                    },
                    'default_preset': self._default_preset,
                }, f, indent=2)
        except Exception:
            pass

    # ---- Named OCR Presets ----

    def _apply_preset_data(self, p):
        self._all_region = p.get('all_region') or None
        self._single_regions = dict(p.get('single_regions') or {})

    def save_ocr_preset(self, name):
        name = str(name).strip()
        if not name:
            return False
        self._presets[name] = {
            'all_region': self._all_region,
            'single_regions': dict(self._single_regions),
        }
        self.save_config()
        return True

    def load_ocr_preset(self, name):
        if name not in self._presets:
            return False
        self._apply_preset_data(self._presets[name])
        self.save_config()
        return True

    def delete_ocr_preset(self, name):
        if name in self._presets:
            del self._presets[name]
            if self._default_preset == name:
                self._default_preset = None
            self.save_config()
            return True
        return False

    def set_default_ocr_preset(self, name):
        if name is None or name == '':
            self._default_preset = None
        elif name in self._presets:
            self._default_preset = name
        else:
            return False
        self.save_config()
        return True

    def list_ocr_presets(self):
        return {
            'presets': sorted(self._presets.keys()),
            'default': self._default_preset,
        }

    def set_region(self, x, y, w, h):
        self._all_region = (int(x), int(y), int(w), int(h))
        self._single_regions = {}
        self.save_config()

    def set_single_region(self, resource, x, y, w, h):
        self._single_regions[resource] = (int(x), int(y), int(w), int(h))
        self.save_config()

    def reset_regions(self):
        """Clear all saved regions."""
        self._all_region = None
        self._single_regions = {}
        self.save_config()

    # ---- Compat ----

    def set_anchor(self, x, y):
        self.set_region(x - 40, y - 16, 80, 128)

    def save_single_position(self, resource, x, y):
        self.set_single_region(resource, x - 40, y - 16, 80, 32)

    def save_position(self, resource, x, y):
        self.save_single_position(resource, x, y)

    @property
    def has_deps(self):
        return HAS_DEPS

    @property
    def has_saved_positions(self):
        return self._all_region is not None or len(self._single_regions) > 0

    # ---- Capture ----

    def _capture_rect(self, x, y, w, h):
        if not HAS_DEPS or not self._sct:
            return None
        try:
            shot = self._sct.grab({"left": x, "top": y, "width": w, "height": h})
            return np.array(shot)[:, :, :3]
        except Exception:
            return None

    # ---- Public API ----

    def read_all(self):
        """Read all 4 resource villager counts.
        Returns dict: {'food': (val, conf), ...}"""
        results = {}

        if self._all_region:
            rx, ry, rw, rh = self._all_region
            img = self._capture_rect(rx, ry, rw, rh)
            if img is None:
                return {r: (None, 0.0) for r in RESOURCES}
            row_h = rh // 4
            for i, res in enumerate(RESOURCES):
                if res in self._single_regions:
                    sx, sy, sw, sh = self._single_regions[res]
                    crop = self._capture_rect(sx, sy, sw, sh)
                else:
                    y1 = i * row_h
                    y2 = (i + 1) * row_h if i < 3 else rh
                    crop = img[y1:y2, 0:rw]
                if crop is not None and crop.size > 0:
                    val, conf = self._read_number(crop)
                    results[res] = (val, conf)
                else:
                    results[res] = (None, 0.0)
        else:
            for res in RESOURCES:
                if res in self._single_regions:
                    sx, sy, sw, sh = self._single_regions[res]
                    crop = self._capture_rect(sx, sy, sw, sh)
                    if crop is not None:
                        val, conf = self._read_number(crop)
                        results[res] = (val, conf)
                    else:
                        results[res] = (None, 0.0)
                else:
                    results[res] = (None, 0.0)
        return results

    def read_single_region(self, resource):
        if resource in self._single_regions:
            sx, sy, sw, sh = self._single_regions[resource]
            crop = self._capture_rect(sx, sy, sw, sh)
            if crop is not None:
                return self._read_number(crop)
        return None, 0.0

    def read_single(self, cx, cy):
        img = self._capture_rect(cx - 40, cy - 16, 80, 32)
        if img is None:
            return None, 0.0, None
        preview = self._img_to_base64(img)
        val, conf = self._read_number(img)
        return val, conf, preview

    def read_all_saved(self):
        return self.read_all()

    # ---- OCR Engine (AlexNet) ----

    def _read_number(self, img):
        """Read a number from a BGR image of arbitrary size.
        Handles any region size — normalizes internally.
        Returns (int|None, confidence)."""
        if not HAS_DEPS:
            return None, 0.0

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        h_orig, w_orig = gray.shape

        # Normalize: scale so the shorter side is ~48px for consistent processing
        target_short = 48
        short_side = min(h_orig, w_orig)
        if short_side < 16:
            scale = target_short / max(short_side, 1)
        elif short_side < target_short:
            scale = target_short / short_side
        else:
            scale = 1.0
        if scale != 1.0:
            gray = cv2.resize(gray, None, fx=scale, fy=scale,
                              interpolation=cv2.INTER_CUBIC)

        best_val, best_conf = None, 0.0
        for binary in self._make_binaries(gray):
            val, conf = self._ocr_from_binary(binary)
            if val is not None and conf > best_conf:
                best_val, best_conf = val, conf
        return best_val, best_conf

    def _make_binaries(self, gray):
        """Generate binary images. Game text is bright on dark HUD."""
        out = []
        # Otsu
        _, b = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        if np.sum(b > 0) / b.size > 0.5:
            b = cv2.bitwise_not(b)
        out.append(b)
        # Fixed thresholds — cover range of text brightness
        for t in [100, 130, 160, 190]:
            _, b = cv2.threshold(gray, t, 255, cv2.THRESH_BINARY)
            out.append(b)
        # Adaptive (good when background isn't uniform)
        h, w = gray.shape
        block = min(h, w) | 1  # must be odd
        block = max(11, min(block, 51))
        b = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY, block, -4)
        out.append(b)
        return out

    def _ocr_from_binary(self, binary):
        """Determine digit count first, then classify each digit.
        Strategy: find the entire digit cluster bounding box, estimate how many
        digits based on width/height ratio, then split and classify.
        Returns (number, avg_conf)."""
        # Morphological cleanup — close small gaps within digits, remove noise
        k_close = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        clean = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, k_close)
        k_open = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        clean = cv2.morphologyEx(clean, cv2.MORPH_OPEN, k_open)

        contours, _ = cv2.findContours(clean, cv2.RETR_EXTERNAL,
                                        cv2.CHAIN_APPROX_SIMPLE)
        h_img, w_img = binary.shape

        # Collect candidate digit regions
        candidates = []
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            if h < max(h_img * 0.15, 4) or w < 2:
                continue
            if w / max(h, 1) > 3.0:
                continue
            area = cv2.contourArea(cnt)
            if area < 8:
                continue
            candidates.append((x, y, w, h))

        if not candidates:
            return None, 0.0

        candidates.sort(key=lambda r: r[0])

        # Find dominant digit height
        heights = sorted([c[3] for c in candidates], reverse=True)
        ref_h = heights[0] if heights else h_img
        # Keep only contours whose height is >= 40% of tallest
        filtered = [c for c in candidates if c[3] >= ref_h * 0.4]
        if not filtered:
            filtered = candidates

        # Compute the bounding box of the ENTIRE digit cluster
        all_x1 = min(c[0] for c in filtered)
        all_y1 = min(c[1] for c in filtered)
        all_x2 = max(c[0] + c[2] for c in filtered)
        all_y2 = max(c[1] + c[3] for c in filtered)
        cluster_w = all_x2 - all_x1
        cluster_h = all_y2 - all_y1

        if cluster_h < 3 or cluster_w < 1:
            return None, 0.0

        # ---- Step 1: Determine digit count from cluster aspect ratio ----
        # Typical single-digit aspect ratios (w/h):
        #   "1": 0.15-0.35 (very thin)
        #   "0"-"9" (non-1): 0.4-0.7
        # For multi-digit numbers, the cluster width grows proportionally.
        # We use the cluster width vs cluster height to estimate digit count.
        cluster_aspect = cluster_w / max(cluster_h, 1)

        if cluster_aspect < 0.8:
            n_digits = 1
        elif cluster_aspect < 1.5:
            n_digits = 2
        else:
            n_digits = 3

        # ---- Step 2: Try segmentation approaches in order of reliability ----
        cluster_roi = clean[all_y1:all_y2, all_x1:all_x2]
        digits, total_conf = [], 0.0

        if n_digits == 1:
            # Single digit — classify the whole cluster
            d, c = self._classify_roi(cluster_roi)
            if d is not None and c > 0.2:
                digits.append(d)
                total_conf += c
        else:
            # Multi-digit: first try projection-based splitting
            proj_result = self._split_by_projection(cluster_roi, n_digits)
            if proj_result and len(proj_result) == n_digits:
                digits = [d for d, c in proj_result]
                total_conf = sum(c for d, c in proj_result)
            else:
                # Fallback: try contour-based individual segments
                contour_result = self._split_by_contours(
                    clean, filtered, ref_h, n_digits)
                if contour_result and len(contour_result) >= n_digits - 1:
                    digits = [d for d, c in contour_result]
                    total_conf = sum(c for d, c in contour_result)
                else:
                    # Last resort: split cluster evenly by estimated digit count
                    even_result = self._split_evenly(
                        cluster_roi, n_digits)
                    if even_result:
                        digits = [d for d, c in even_result]
                        total_conf = sum(c for d, c in even_result)

        if not digits:
            return None, 0.0
        number = int(''.join(str(d) for d in digits))
        avg_conf = total_conf / len(digits)

        # Villager count 0-200: reject obviously wrong results
        if number > 200:
            # If 3-digit result > 200, maybe it was actually 2 digits
            # Try re-reading as 2 digits
            if n_digits == 3:
                retry = self._split_evenly(cluster_roi, 2)
                if retry:
                    alt_num = int(''.join(str(d) for d, c in retry))
                    alt_conf = sum(c for d, c in retry) / 2
                    if alt_num <= 200 and alt_conf > 0.3:
                        return alt_num, alt_conf
            return None, 0.0

        return number, avg_conf

    def _split_by_projection(self, roi, expected_n):
        """Split ROI into digits using vertical projection profile.
        Returns list of (digit, conf) or None."""
        h, w = roi.shape[:2]
        if w < 4:
            return None

        proj = np.sum(roi > 0, axis=0).astype(float)
        threshold = max(1, h * 0.08)

        # Find segments (columns with enough white pixels)
        in_seg, segments, start = False, [], 0
        for i in range(w):
            if proj[i] > threshold:
                if not in_seg:
                    start = i
                    in_seg = True
            else:
                if in_seg:
                    segments.append((start, i))
                    in_seg = False
        if in_seg:
            segments.append((start, w))

        if len(segments) < 2:
            return None  # No clear gaps found

        # If segments match expected count, use them directly
        if len(segments) == expected_n:
            results = []
            for (x1, x2) in segments:
                if x2 - x1 < 2:
                    continue
                d, c = self._classify_roi(roi[:, x1:x2])
                if d is not None and c > 0.2:
                    results.append((d, c))
            return results if len(results) == expected_n else None

        # If we found more segments than expected, merge closest pairs
        if len(segments) > expected_n:
            while len(segments) > expected_n:
                # Find pair with smallest gap and merge
                min_gap, merge_idx = float('inf'), 0
                for i in range(len(segments) - 1):
                    gap = segments[i + 1][0] - segments[i][1]
                    if gap < min_gap:
                        min_gap = gap
                        merge_idx = i
                merged = (segments[merge_idx][0], segments[merge_idx + 1][1])
                segments = segments[:merge_idx] + [merged] + segments[merge_idx+2:]

            results = []
            for (x1, x2) in segments:
                if x2 - x1 < 2:
                    continue
                d, c = self._classify_roi(roi[:, x1:x2])
                if d is not None and c > 0.2:
                    results.append((d, c))
            return results if len(results) == expected_n else None

        return None

    def _split_by_contours(self, clean, filtered, ref_h, expected_n):
        """Use individual contour bounding boxes as digit regions.
        Merge nearby contours then classify. Returns list of (digit, conf) or None."""
        # Merge overlapping/close contours
        merged = [list(filtered[0])]
        for r in filtered[1:]:
            prev = merged[-1]
            gap = r[0] - (prev[0] + prev[2])
            if gap < max(ref_h * 0.12, 2):
                x = min(prev[0], r[0])
                y = min(prev[1], r[1])
                x2 = max(prev[0] + prev[2], r[0] + r[2])
                y2 = max(prev[1] + prev[3], r[1] + r[3])
                merged[-1] = [x, y, x2 - x, y2 - y]
            else:
                merged.append(list(r))

        if len(merged) > expected_n + 1:
            merged.sort(key=lambda r: r[3], reverse=True)
            merged = merged[:expected_n]
            merged.sort(key=lambda r: r[0])

        results = []
        for (x, y, w, h) in merged:
            roi = clean[y:y+h, x:x+w]
            aspect = w / max(h, 1)
            # If a merged region is still too wide, it contains multiple digits
            if aspect > 0.85 and len(merged) < expected_n:
                sub_n = expected_n - len(merged) + 1
                sub = self._split_evenly(roi, sub_n)
                if sub:
                    results.extend(sub)
                    continue
            d, c = self._classify_roi(roi)
            if d is not None and c > 0.2:
                results.append((d, c))
        return results if results else None

    def _split_evenly(self, roi, n_digits):
        """Split ROI into n_digits equal-width segments and classify each.
        Returns list of (digit, conf) or None."""
        h, w = roi.shape[:2]
        if w < n_digits * 2:
            return None
        seg_w = w / n_digits
        results = []
        for i in range(n_digits):
            x1 = int(i * seg_w)
            x2 = int((i + 1) * seg_w)
            x2 = min(x2, w)
            if x2 - x1 < 2:
                continue
            d, c = self._classify_roi(roi[:, x1:x2])
            if d is not None and c > 0.2:
                results.append((d, c))
        return results if len(results) == n_digits else None

    def _classify_roi(self, roi):
        """Normalize any-size binary ROI to 32x32 and classify with AlexNet.
        Handles thin digits (like '1'), wide digits, any aspect ratio."""
        if roi.size == 0 or roi.shape[0] < 3 or roi.shape[1] < 1:
            return None, 0.0

        h, w = roi.shape[:2]

        # Tight-crop to actual content (remove empty border)
        coords = cv2.findNonZero(roi)
        if coords is None:
            return None, 0.0
        cx, cy, cw, ch = cv2.boundingRect(coords)
        roi = roi[cy:cy+ch, cx:cx+cw]
        h, w = roi.shape[:2]

        if h < 2 or w < 1:
            return None, 0.0

        # Target: center digit in 20x20 area inside 32x32 (like MNIST convention)
        # Scale to fit in 20x20 box preserving aspect ratio
        target_box = 20
        scale = target_box / max(h, w)
        new_h = max(1, int(h * scale))
        new_w = max(1, int(w * scale))
        resized = cv2.resize(roi, (new_w, new_h), interpolation=cv2.INTER_AREA)

        # Place centered in 32x32
        digit_img = np.zeros((INPUT_SIZE, INPUT_SIZE), dtype=np.uint8)
        y_off = (INPUT_SIZE - new_h) // 2
        x_off = (INPUT_SIZE - new_w) // 2
        digit_img[y_off:y_off+new_h, x_off:x_off+new_w] = resized

        return self._classify_digit(digit_img)

    # ---- Util ----

    def _img_to_base64(self, img, max_width=200):
        h, w = img.shape[:2]
        if w > max_width:
            s = max_width / w
            img = cv2.resize(img, (max_width, int(h * s)))
        _, buf = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 75])
        return base64.b64encode(buf).decode('utf-8')
