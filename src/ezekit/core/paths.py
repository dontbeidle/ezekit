"""Data directory resolution for ezekit."""

import os
from pathlib import Path


def get_data_dir() -> Path:
    """Return the ezekit data directory (~/.ezekit/), creating it if needed."""
    data_dir = Path(os.environ.get("EZEKIT_DATA_DIR", Path.home() / ".ezekit"))
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir


def get_db_path() -> Path:
    """Return the path to the SQLite database."""
    return get_data_dir() / "ezekit.db"


def get_projects_dir() -> Path:
    """Return the directory where project page images are stored."""
    d = get_data_dir() / "projects"
    d.mkdir(parents=True, exist_ok=True)
    return d
