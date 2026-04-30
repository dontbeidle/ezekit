"""Discover installed ezekit modules."""

from __future__ import annotations

from typing import Any


def get_installed_modules() -> dict[str, dict[str, Any]]:
    """Return a dict of module_name -> info for all available modules."""
    modules: dict[str, dict[str, Any]] = {}

    # OCR module — always bundled
    try:
        from ezekit.modules.ocr.cli import ocr_cli

        modules["ocr"] = {
            "description": "OCR annotation tool for creating image-text datasets",
            "cli_group": ocr_cli,
        }
    except ImportError:
        pass

    return modules
