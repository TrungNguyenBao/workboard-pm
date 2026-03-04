import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin


class KpiAssignment(Base, TimestampMixin):
    __tablename__ = "kpi_assignments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    template_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("kpi_templates.id", ondelete="CASCADE"), index=True)
    employee_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"), index=True)
    period: Mapped[str] = mapped_column(String(7))
    target_value: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    actual_value: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    weight: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(20), default="active")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)
