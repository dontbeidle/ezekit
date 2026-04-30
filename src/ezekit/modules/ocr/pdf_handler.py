"""PDF rendering — converts PDF pages to PNG images."""

from __future__ import annotations

from pathlib import Path


def render_pdf_pages(
    pdf_path: str | Path,
    output_dir: str | Path,
    dpi: int = 150,
) -> list[dict]:
    """Render each page of a PDF to a PNG image.

    Returns a list of dicts with page_number, image_path, width, height.
    """
    import fitz  # PyMuPDF

    pdf_path = Path(pdf_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(str(pdf_path))
    pages = []

    zoom = dpi / 72.0
    matrix = fitz.Matrix(zoom, zoom)

    for page_num in range(len(doc)):
        page = doc[page_num]
        pix = page.get_pixmap(matrix=matrix)
        image_path = output_dir / f"page_{page_num + 1:04d}.png"
        pix.save(str(image_path))
        pages.append(
            {
                "page_number": page_num + 1,
                "image_path": str(image_path),
                "width": pix.width,
                "height": pix.height,
            }
        )

    doc.close()
    return pages
