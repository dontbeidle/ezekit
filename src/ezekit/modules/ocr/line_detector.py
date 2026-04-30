"""Line detection using PaddleOCR — lazy-loaded optional dependency."""

from __future__ import annotations

# Module-level cache for the TextDetection instance
_detector = None


def is_available() -> bool:
    """Check if paddleocr is installed."""
    try:
        import paddleocr  # noqa: F401

        return True
    except ImportError:
        return False


def _get_detector():
    """Return a cached TextDetection instance (PaddleOCR v3 API)."""
    global _detector
    if _detector is not None:
        return _detector

    from paddleocr import TextDetection

    _detector = TextDetection(
        model_name="PP-OCRv5_server_det",
        device="cpu",
    )
    return _detector


# Padding in pixels to apply to detected bounding boxes
PAD_TOP = 5
PAD_BOTTOM = 3
PAD_LEFT = 2
PAD_RIGHT = 2

# Minimum size for a valid detection
MIN_WIDTH = 20
MIN_HEIGHT = 10


def detect_lines(image_path: str, image_width: int, image_height: int) -> list[dict]:
    """Detect text line bounding boxes in an image.

    Returns a list of dicts with x, y, width, height (in pixel coordinates),
    sorted top-to-bottom.
    """
    detector = _get_detector()
    output = detector.predict(image_path, batch_size=1)

    boxes = []
    for res in output:
        polys = res["dt_polys"]
        if polys is None or len(polys) == 0:
            continue

        for poly in polys:
            # Each poly is a (4, 2) array of corner points
            xs = [p[0] for p in poly]
            ys = [p[1] for p in poly]

            x = min(xs) - PAD_LEFT
            y = min(ys) - PAD_TOP
            x2 = max(xs) + PAD_RIGHT
            y2 = max(ys) + PAD_BOTTOM

            # Clamp to image bounds
            x = max(0, x)
            y = max(0, y)
            x2 = min(image_width, x2)
            y2 = min(image_height, y2)

            w = x2 - x
            h = y2 - y

            # Filter out too-small detections
            if w < MIN_WIDTH or h < MIN_HEIGHT:
                continue

            boxes.append({
                "x": round(float(x), 1),
                "y": round(float(y), 1),
                "width": round(float(w), 1),
                "height": round(float(h), 1),
            })

    # Sort top-to-bottom, then left-to-right
    boxes.sort(key=lambda b: (b["y"], b["x"]))
    return boxes
