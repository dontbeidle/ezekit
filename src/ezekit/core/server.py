"""FastAPI application factory."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from ezekit.core.db import init_db


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(title="ezekit", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    init_db()

    # Register module routers
    from ezekit.modules.ocr.api import router as ocr_router

    app.include_router(ocr_router, prefix="/api/ocr")

    # Serve built frontend if it exists
    ui_dir = Path(__file__).parent.parent / "modules" / "ocr" / "ui"
    if ui_dir.is_dir():
        app.mount("/", StaticFiles(directory=str(ui_dir), html=True), name="ui")

    return app
