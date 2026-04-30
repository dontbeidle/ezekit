"""Export annotated crops to various dataset formats."""

from __future__ import annotations

import io
import re
import zipfile
from pathlib import Path

from sqlalchemy.orm import Session

from ezekit.modules.ocr.crop_handler import extract_crop
from ezekit.modules.ocr.models import Crop, Page, Project


def _sanitize_name(name: str) -> str:
    """Sanitize a project name for use in filenames."""
    return re.sub(r"[^\w]+", "_", name).strip("_")


def _get_exportable_crops(db: Session, project_id: int) -> list[Crop]:
    """Get all crops with non-empty text, ordered by page then crop index."""
    query = (
        db.query(Crop)
        .join(Page)
        .filter(Page.project_id == project_id)
        .filter(Crop.text.isnot(None))
        .filter(Crop.text != "")
        .order_by(Page.page_number, Crop.order_index)
    )
    crops = query.all()
    # Filter out whitespace-only text
    return [c for c in crops if c.text.strip()]


def get_export_count(db: Session, project_id: int) -> int:
    """Return the number of annotations that would be exported."""
    return len(_get_exportable_crops(db, project_id))


def export_parquet(
    db: Session,
    project_id: int,
    output_path: str | Path,
) -> Path:
    """Export project crops to a Parquet file with image + text columns.

    Uses the HuggingFace `datasets` library for Parquet with Image feature.
    """
    from datasets import Dataset, Features, Image, Value

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise ValueError(f"Project {project_id} not found")

    crops = _get_exportable_crops(db, project_id)
    if not crops:
        raise ValueError(
            "No annotations to export. Please add text to your crops first."
        )

    images = []
    texts = []

    for crop in crops:
        page = crop.page
        img = extract_crop(
            page.image_path,
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            crop.rotation,
        )
        images.append(img)
        texts.append(crop.text)

    ds = Dataset.from_dict(
        {"image": images, "text": texts},
        features=Features({"image": Image(), "text": Value("string")}),
    )
    ds.to_parquet(str(output_path))
    return output_path


def export_imagestext(
    db: Session,
    project_id: int,
    output_path: str | Path,
) -> Path:
    """Export project crops as a ZIP with images/ and texts/ directories.

    Structure:
        images/000001.png, images/000002.png, ...
        texts/000001.txt, texts/000002.txt, ...
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise ValueError(f"Project {project_id} not found")

    crops = _get_exportable_crops(db, project_id)
    if not crops:
        raise ValueError(
            "No annotations to export. Please add text to your crops first."
        )

    with zipfile.ZipFile(str(output_path), "w", zipfile.ZIP_DEFLATED) as zf:
        for idx, crop in enumerate(crops, start=1):
            num = f"{idx:06d}"
            page = crop.page

            # Extract crop image and write as PNG to ZIP
            img = extract_crop(
                page.image_path,
                crop.x,
                crop.y,
                crop.width,
                crop.height,
                crop.rotation,
            )
            img_buf = io.BytesIO()
            img.save(img_buf, format="PNG")
            zf.writestr(f"images/{num}.png", img_buf.getvalue())

            # Write text file (UTF-8, no BOM, no trailing newline)
            zf.writestr(f"texts/{num}.txt", crop.text.encode("utf-8"))

    return output_path
