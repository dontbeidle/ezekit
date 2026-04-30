"""SQLAlchemy models for the OCR module."""

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ezekit.core.db import Base


class Project(Base):
    __tablename__ = "ocr_projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    pdf_path: Mapped[str] = mapped_column(Text, nullable=False)
    page_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    pages: Mapped[list["Page"]] = relationship(
        "Page", back_populates="project", cascade="all, delete-orphan"
    )
    charsets: Mapped[list["Charset"]] = relationship(
        "Charset", back_populates="project", cascade="all, delete-orphan"
    )


class Page(Base):
    __tablename__ = "ocr_pages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("ocr_projects.id", ondelete="CASCADE"), nullable=False
    )
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    image_path: Mapped[str] = mapped_column(Text, nullable=False)
    width: Mapped[int] = mapped_column(Integer, default=0)
    height: Mapped[int] = mapped_column(Integer, default=0)

    project: Mapped["Project"] = relationship("Project", back_populates="pages")
    crops: Mapped[list["Crop"]] = relationship(
        "Crop", back_populates="page", cascade="all, delete-orphan"
    )


class Crop(Base):
    __tablename__ = "ocr_crops"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    page_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("ocr_pages.id", ondelete="CASCADE"), nullable=False
    )
    x: Mapped[float] = mapped_column(Float, nullable=False)
    y: Mapped[float] = mapped_column(Float, nullable=False)
    width: Mapped[float] = mapped_column(Float, nullable=False)
    height: Mapped[float] = mapped_column(Float, nullable=False)
    rotation: Mapped[float] = mapped_column(Float, default=0.0)
    text: Mapped[str] = mapped_column(Text, default="")
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    page: Mapped["Page"] = relationship("Page", back_populates="crops")


class Charset(Base):
    __tablename__ = "ocr_charsets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("ocr_projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    project: Mapped["Project"] = relationship("Project", back_populates="charsets")
    chars: Mapped[list["CharsetChar"]] = relationship(
        "CharsetChar", back_populates="charset", cascade="all, delete-orphan"
    )


class CharsetChar(Base):
    __tablename__ = "ocr_charset_chars"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    charset_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("ocr_charsets.id", ondelete="CASCADE"), nullable=False
    )
    char: Mapped[str] = mapped_column(String(10), nullable=False)
    label: Mapped[str] = mapped_column(String(50), default="")
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    charset: Mapped["Charset"] = relationship("Charset", back_populates="chars")
