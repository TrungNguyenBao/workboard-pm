import uuid

from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import SoftDeleteMixin, TimestampMixin


class Comment(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tasks.id"), index=True)
    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    body: Mapped[str] = mapped_column(Text)  # rich-text HTML / JSON (Tiptap)
    body_text: Mapped[str | None] = mapped_column(Text, nullable=True)  # plain text for mentions/search

    task: Mapped["Task"] = relationship(back_populates="comments")  # noqa: F821
    author: Mapped["User"] = relationship(foreign_keys=[author_id])  # noqa: F821
