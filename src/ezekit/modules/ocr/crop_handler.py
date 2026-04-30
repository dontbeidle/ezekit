"""Image cropping — extracts crop regions from page images."""

from __future__ import annotations

from pathlib import Path

from PIL import Image


def extract_crop(
    image_path: str | Path,
    x: float,
    y: float,
    width: float,
    height: float,
    rotation: float = 0.0,
    scale: float = 1.0,
) -> Image.Image:
    """Extract a crop region from a page image.

    Coordinates are in display pixels (same space as the rendered page image).
    """
    img = Image.open(image_path)

    # Normalize negative width/height (reverse-drawn crops)
    if width < 0:
        x = x + width
        width = -width
    if height < 0:
        y = y + height
        height = -height

    # Scale coordinates to source image pixel coords
    left = int(x * scale)
    top = int(y * scale)
    right = int((x + width) * scale)
    bottom = int((y + height) * scale)

    # Clamp to image bounds
    left = max(0, min(left, img.width))
    top = max(0, min(top, img.height))
    right = max(0, min(right, img.width))
    bottom = max(0, min(bottom, img.height))

    # Ensure valid crop box (left < right, top < bottom)
    if right <= left or bottom <= top:
        return Image.new("RGB", (1, 1), (255, 255, 255))

    cropped = img.crop((left, top, right, bottom))

    if rotation:
        cropped = cropped.rotate(-rotation, expand=True, fillcolor=(255, 255, 255))

    return cropped


def save_crop(
    image_path: str | Path,
    output_path: str | Path,
    x: float,
    y: float,
    width: float,
    height: float,
    rotation: float = 0.0,
) -> Path:
    """Extract and save a crop to disk. Returns the output path."""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    crop = extract_crop(image_path, x, y, width, height, rotation)
    crop.save(str(output_path))
    return output_path
