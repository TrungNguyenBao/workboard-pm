import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import PORTABLE_JSONB, Base
from app.models.base import TimestampMixin


class Interview(Base, TimestampMixin):
    __tablename__ = "interviews"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    candidate_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("candidates.id", ondelete="CASCADE"), index=True
    )
    interviewer_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("employees.id"), nullable=True)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    feedback: Mapped[dict | None] = mapped_column(PORTABLE_JSONB, nullable=True)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="scheduled")
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)
    room: Mapped[str | None] = mapped_column(String(100), nullable=True)
    panel_ids: Mapped[list | None] = mapped_column(PORTABLE_JSONB, nullable=True)
    # panel_ids: list of user UUID strings for multi-interviewer panels

    candidate: Mapped["Candidate"] = relationship(back_populates="interviews")  # noqa: F821
    interviewer: Mapped["Employee | None"] = relationship()  # noqa: F821
    workspace: Mapped["Workspace"] = relationship()  # noqa: F821
