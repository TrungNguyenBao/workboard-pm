import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class InsuranceRecord(Base, TimestampMixin):
    __tablename__ = "insurance_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), index=True
    )
    insurance_type: Mapped[str] = mapped_column(String(50))  # bhxh / bhyt / bhtn
    base_salary: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    employee_rate: Mapped[Decimal] = mapped_column(Numeric(5, 4))  # e.g., 0.0800 = 8%
    employer_rate: Mapped[Decimal] = mapped_column(Numeric(5, 4))  # e.g., 0.1750 = 17.5%
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    effective_to: Mapped[date | None] = mapped_column(Date, nullable=True)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)

    employee: Mapped["Employee"] = relationship()  # noqa: F821
    workspace: Mapped["Workspace"] = relationship()  # noqa: F821
