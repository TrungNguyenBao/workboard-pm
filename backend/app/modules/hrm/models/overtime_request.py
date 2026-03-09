import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class OvertimeRequest(Base, TimestampMixin):
    __tablename__ = "overtime_requests"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    employee_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("employees.id"), index=True)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)
    date: Mapped[date] = mapped_column(Date)
    planned_hours: Mapped[Decimal] = mapped_column(Numeric(4, 2))
    reason: Mapped[str] = mapped_column(String(500))
    # pending / approved / rejected
    status: Mapped[str] = mapped_column(String(20), default="pending", server_default="pending")
    approved_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    employee: Mapped["Employee"] = relationship("Employee", foreign_keys=[employee_id])  # noqa: F821
