import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class ExitInterview(Base, TimestampMixin):
    __tablename__ = "exit_interviews"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    resignation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("resignations.id", ondelete="CASCADE"), unique=True, index=True)
    interviewer_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("employees.id"), nullable=True)
    feedback: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    conducted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)

    resignation: Mapped["Resignation"] = relationship(back_populates="exit_interview")  # noqa: F821
    interviewer: Mapped["Employee | None"] = relationship()  # noqa: F821
    workspace: Mapped["Workspace"] = relationship()  # noqa: F821
