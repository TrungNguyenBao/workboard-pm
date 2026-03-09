import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import SoftDeleteMixin, TimestampMixin


class Sprint(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "sprints"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    goal: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    end_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20), default="planning", index=True
    )
    created_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))

    project: Mapped["Project"] = relationship(back_populates="sprints")  # noqa: F821
    created_by: Mapped["User"] = relationship(foreign_keys=[created_by_id])  # noqa: F821
    tasks: Mapped[list["Task"]] = relationship(back_populates="sprint")  # noqa: F821
