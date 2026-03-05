import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Resignation(Base, TimestampMixin):
    __tablename__ = "resignations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    employee_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"), index=True)
    resignation_date: Mapped[date] = mapped_column(Date)
    last_working_day: Mapped[date] = mapped_column(Date)
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", server_default="pending")
    approved_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)

    employee: Mapped["Employee"] = relationship(foreign_keys=[employee_id])  # noqa: F821
    approved_by: Mapped["User | None"] = relationship()  # noqa: F821
    workspace: Mapped["Workspace"] = relationship()  # noqa: F821
    handover_tasks: Mapped[list["HandoverTask"]] = relationship(back_populates="resignation", cascade="all, delete-orphan")  # noqa: F821
    exit_interview: Mapped["ExitInterview | None"] = relationship(back_populates="resignation", uselist=False)  # noqa: F821
