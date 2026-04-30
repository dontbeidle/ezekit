"""Database setup — SQLAlchemy engine, Base, session factory."""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from ezekit.core.paths import get_db_path

_engine = None
_SessionLocal = None


class Base(DeclarativeBase):
    pass


def get_engine():
    global _engine
    if _engine is None:
        db_path = get_db_path()
        _engine = create_engine(f"sqlite:///{db_path}", echo=False)
    return _engine


def get_session_factory() -> sessionmaker[Session]:
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(bind=get_engine())
    return _SessionLocal


def get_db():
    """FastAPI dependency that yields a database session."""
    session_factory = get_session_factory()
    db = session_factory()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables."""
    # Import models so they register with Base.metadata
    import ezekit.modules.ocr.models  # noqa: F401

    Base.metadata.create_all(bind=get_engine())
