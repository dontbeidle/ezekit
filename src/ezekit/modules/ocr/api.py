"""FastAPI router for the OCR module — all /api/ocr/ endpoints."""

from __future__ import annotations

import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ezekit.core.db import get_db
from ezekit.core.paths import get_data_dir, get_projects_dir
from ezekit.modules.ocr.models import Charset, CharsetChar, Crop, Page, Project

router = APIRouter()


# ──────────────────────────── Pydantic schemas ────────────────────────────


MAX_PDF_SIZE = 500 * 1024 * 1024  # 500 MB
PDF_MAGIC = b"%PDF"


class ProjectOut(BaseModel):
    id: int
    name: str
    pdf_path: str
    page_count: int
    total_crops: int = 0

    model_config = {"from_attributes": True}


class PageOut(BaseModel):
    id: int
    page_number: int
    width: int
    height: int
    crop_count: int = 0

    model_config = {"from_attributes": True}


class CropCreate(BaseModel):
    x: float
    y: float
    width: float
    height: float
    rotation: float = 0.0
    text: str = ""
    order_index: int = 0


class CropUpdate(BaseModel):
    x: float | None = None
    y: float | None = None
    width: float | None = None
    height: float | None = None
    rotation: float | None = None
    text: str | None = None
    order_index: int | None = None


class CropOut(BaseModel):
    id: int
    page_id: int
    x: float
    y: float
    width: float
    height: float
    rotation: float
    text: str
    order_index: int

    model_config = {"from_attributes": True}


class CharCharCreate(BaseModel):
    char: str
    label: str = ""
    order_index: int = 0


class CharsetCreate(BaseModel):
    name: str
    chars: list[CharCharCreate] | None = None


class CharsetCharOut(BaseModel):
    id: int
    char: str
    label: str
    order_index: int

    model_config = {"from_attributes": True}


class CharsetOut(BaseModel):
    id: int
    name: str
    project_id: int
    chars: list[CharsetCharOut] = []

    model_config = {"from_attributes": True}



# ──────────────────────────── Projects ────────────────────────────


@router.get("/projects", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.updated_at.desc()).all()
    result = []
    for p in projects:
        total_crops = sum(len(pg.crops) for pg in p.pages)
        result.append(
            ProjectOut(
                id=p.id,
                name=p.name,
                pdf_path=p.pdf_path,
                page_count=p.page_count,
                total_crops=total_crops,
            )
        )
    return result


@router.post("/projects", response_model=ProjectOut)
async def create_project(
    name: str = Form(...),
    pdf_file: UploadFile = Form(...),
    db: Session = Depends(get_db),
):
    # Validate file size via Content-Length or by reading
    content = await pdf_file.read()
    if len(content) > MAX_PDF_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 500 MB)")

    # Validate PDF magic bytes
    if not content[:4].startswith(PDF_MAGIC):
        raise HTTPException(status_code=400, detail="Invalid PDF file")

    # Validate with PyMuPDF
    import fitz

    try:
        doc = fitz.open(stream=content, filetype="pdf")
        if doc.page_count == 0:
            raise HTTPException(status_code=400, detail="PDF has no pages")
        doc.close()
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=400, detail="Invalid or corrupted PDF file")

    # Create project record to get an ID
    project = Project(name=name, pdf_path="")
    db.add(project)
    db.flush()

    project_dir = get_projects_dir() / str(project.id)
    try:
        # Save uploaded PDF
        project_dir.mkdir(parents=True, exist_ok=True)
        pdf_path = project_dir / "source.pdf"
        pdf_path.write_bytes(content)
        project.pdf_path = str(pdf_path)

        # Render PDF pages
        from ezekit.modules.ocr.pdf_handler import render_pdf_pages

        pages_info = render_pdf_pages(pdf_path, project_dir / "pages")

        for info in pages_info:
            page = Page(
                project_id=project.id,
                page_number=info["page_number"],
                image_path=info["image_path"],
                width=info["width"],
                height=info["height"],
            )
            db.add(page)

        project.page_count = len(pages_info)
        db.commit()
        db.refresh(project)
    except Exception:
        # Cleanup on failure
        db.rollback()
        if project_dir.exists():
            shutil.rmtree(project_dir)
        raise HTTPException(status_code=500, detail="Failed to create project")

    return ProjectOut(
        id=project.id,
        name=project.name,
        pdf_path=project.pdf_path,
        page_count=project.page_count,
        total_crops=0,
    )


@router.get("/projects/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    total_crops = sum(len(pg.crops) for pg in project.pages)
    return ProjectOut(
        id=project.id,
        name=project.name,
        pdf_path=project.pdf_path,
        page_count=project.page_count,
        total_crops=total_crops,
    )


@router.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Remove project directory (source PDF, rendered pages, etc.)
    project_dir = get_projects_dir() / str(project.id)
    if project_dir.exists():
        shutil.rmtree(project_dir)

    db.delete(project)
    db.commit()
    return {"ok": True}


# ──────────────────────────── Pages ────────────────────────────


@router.get("/projects/{project_id}/pages", response_model=list[PageOut])
def list_pages(project_id: int, db: Session = Depends(get_db)):
    pages = (
        db.query(Page)
        .filter(Page.project_id == project_id)
        .order_by(Page.page_number)
        .all()
    )
    return [
        PageOut(
            id=p.id,
            page_number=p.page_number,
            width=p.width,
            height=p.height,
            crop_count=len(p.crops),
        )
        for p in pages
    ]


@router.get("/pages/{page_id}/image")
def get_page_image(page_id: int, db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    image_path = Path(page.image_path)
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Page image not found on disk")
    return FileResponse(str(image_path), media_type="image/png")



# ──────────────────────────── Crops ────────────────────────────


@router.get("/pages/{page_id}/crops", response_model=list[CropOut])
def list_crops(page_id: int, db: Session = Depends(get_db)):
    crops = (
        db.query(Crop)
        .filter(Crop.page_id == page_id)
        .order_by(Crop.order_index)
        .all()
    )
    return crops


@router.post("/pages/{page_id}/crops", response_model=CropOut)
def create_crop(page_id: int, data: CropCreate, db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    crop = Crop(page_id=page_id, **data.model_dump())
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return crop


@router.patch("/crops/{crop_id}", response_model=CropOut)
def update_crop(crop_id: int, data: CropUpdate, db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(crop, field, value)
    db.commit()
    db.refresh(crop)
    return crop


@router.delete("/crops/{crop_id}")
def delete_crop(crop_id: int, db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    db.delete(crop)
    db.commit()
    return {"ok": True}


# ──────────────────────────── Charsets ────────────────────────────


@router.get("/projects/{project_id}/charsets", response_model=list[CharsetOut])
def list_charsets(project_id: int, db: Session = Depends(get_db)):
    charsets = (
        db.query(Charset).filter(Charset.project_id == project_id).all()
    )
    return charsets


@router.post("/projects/{project_id}/charsets", response_model=CharsetOut)
def create_charset(
    project_id: int, data: CharsetCreate, db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    charset = Charset(project_id=project_id, name=data.name)
    db.add(charset)
    db.flush()

    if data.chars:
        for i, c in enumerate(data.chars):
            char = CharsetChar(
                charset_id=charset.id,
                char=c.char,
                label=c.label,
                order_index=c.order_index or i,
            )
            db.add(char)

    db.commit()
    db.refresh(charset)
    return charset


@router.put("/charsets/{charset_id}", response_model=CharsetOut)
def update_charset(
    charset_id: int, data: CharsetCreate, db: Session = Depends(get_db)
):
    charset = db.query(Charset).filter(Charset.id == charset_id).first()
    if not charset:
        raise HTTPException(status_code=404, detail="Charset not found")

    charset.name = data.name

    # Replace all chars
    db.query(CharsetChar).filter(CharsetChar.charset_id == charset_id).delete()
    if data.chars:
        for i, c in enumerate(data.chars):
            char = CharsetChar(
                charset_id=charset.id,
                char=c.char,
                label=c.label,
                order_index=c.order_index or i,
            )
            db.add(char)

    db.commit()
    db.refresh(charset)
    return charset


@router.delete("/charsets/{charset_id}")
def delete_charset(charset_id: int, db: Session = Depends(get_db)):
    charset = db.query(Charset).filter(Charset.id == charset_id).first()
    if not charset:
        raise HTTPException(status_code=404, detail="Charset not found")
    db.delete(charset)
    db.commit()
    return {"ok": True}


# ──────────────────────────── Auto-detect ────────────────────────────


@router.post("/pages/{page_id}/auto-detect", response_model=list[CropOut])
def auto_detect_lines(
    page_id: int,
    replace: bool = False,
    db: Session = Depends(get_db),
):
    """Detect text lines on a page and create crops for each detected line."""
    from ezekit.modules.ocr.line_detector import is_available

    if not is_available():
        raise HTTPException(
            status_code=501,
            detail=(
                "Auto-detect requires the auto-detect extras. "
                "Install with: pip install ezekit[auto-detect]"
            ),
        )

    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    image_path = Path(page.image_path)
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Page image not found on disk")

    from ezekit.modules.ocr.line_detector import detect_lines

    try:
        boxes = detect_lines(str(image_path), page.width, page.height)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Detection failed: {e}",
        )

    # Optionally delete existing crops
    if replace:
        db.query(Crop).filter(Crop.page_id == page_id).delete()
        start_index = 0
    else:
        existing_count = db.query(Crop).filter(Crop.page_id == page_id).count()
        start_index = existing_count

    created = []
    for i, box in enumerate(boxes):
        crop = Crop(
            page_id=page_id,
            x=box["x"],
            y=box["y"],
            width=box["width"],
            height=box["height"],
            text="",
            order_index=start_index + i,
        )
        db.add(crop)
        created.append(crop)

    db.commit()
    for crop in created:
        db.refresh(crop)

    return created


# ──────────────────────────── Export ────────────────────────────

EXPORT_FORMATS = ("parquet", "imagestext")


@router.get("/projects/{project_id}/export/count")
def export_count(project_id: int, db: Session = Depends(get_db)):
    """Return the number of annotations that would be exported."""
    from ezekit.modules.ocr.export import get_export_count

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"count": get_export_count(db, project_id)}


@router.post("/projects/{project_id}/export")
def export_project_endpoint(
    project_id: int, format: str = "parquet", db: Session = Depends(get_db)
):
    from ezekit.modules.ocr.export import (
        _sanitize_name,
        export_imagestext,
        export_parquet,
    )

    if format not in EXPORT_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid format '{format}'. Must be one of: {', '.join(EXPORT_FORMATS)}",
        )

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    output_dir = get_data_dir() / "exports"
    output_dir.mkdir(parents=True, exist_ok=True)
    safe_name = _sanitize_name(project.name)

    try:
        if format == "parquet":
            output_path = output_dir / f"{safe_name}.parquet"
            export_parquet(db, project_id, output_path)
        else:
            output_path = output_dir / f"{safe_name}_imagestext.zip"
            export_imagestext(db, project_id, output_path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"path": str(output_path), "ok": True}


@router.get("/projects/{project_id}/export/download")
def download_export(
    project_id: int, format: str = "parquet", db: Session = Depends(get_db)
):
    from ezekit.modules.ocr.export import _sanitize_name

    if format not in EXPORT_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid format '{format}'. Must be one of: {', '.join(EXPORT_FORMATS)}",
        )

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    safe_name = _sanitize_name(project.name)
    if format == "parquet":
        output_path = get_data_dir() / "exports" / f"{safe_name}.parquet"
        media_type = "application/octet-stream"
    else:
        output_path = get_data_dir() / "exports" / f"{safe_name}_imagestext.zip"
        media_type = "application/zip"

    if not output_path.exists():
        raise HTTPException(status_code=404, detail="Export not found. Run export first.")
    return FileResponse(
        str(output_path),
        media_type=media_type,
        filename=output_path.name,
    )
