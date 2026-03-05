import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class HandoverTask(Base, TimestampMixin):
    __tablename__ = "handover_tasks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    resignation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("resignations.id", ondelete="CASCADE"), index=True)
    task_name: Mapped[str] = mapped_column(String(255))
    from_employee_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("employees.id"), nullable=True)
    to_employee_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("employees.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", server_default="pending")
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)

    resignation: Mapped["Resignation"] = relationship(back_populates="handover_tasks")  # noqa: F821
    from_employee: Mapped["Employee | None"] = relationship(foreign_keys=[from_employee_id])  # noqa: F821
    to_employee: Mapped["Employee | None"] = relationship(foreign_keys=[to_employee_id])  # noqa: F821
    workspace: Mapped["Workspace"] = relationship()  # noqa: F821
