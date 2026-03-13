import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import PORTABLE_JSONB, Base
from app.models.base import TimestampMixin


class PayrollRecord(Base, TimestampMixin):
    __tablename__ = "payroll_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    employee_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"), index=True)
    period: Mapped[str] = mapped_column(String(7))  # YYYY-MM
    gross: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    net: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    deductions: Mapped[dict | None] = mapped_column(PORTABLE_JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft, approved, paid
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)

    # Enhanced C&B fields
    base_salary: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    allowances: Mapped[dict | None] = mapped_column(PORTABLE_JSONB, nullable=True)
    bhxh_employee: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    bhxh_employer: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    bhyt_employee: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    bhyt_employer: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    bhtn_employee: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    bhtn_employer: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    taxable_income: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    personal_deduction: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=11_000_000)
    dependent_deduction: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    pit_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    working_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    actual_working_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ot_pay: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    dependents: Mapped[int] = mapped_column(Integer, default=0, server_default="0")

    employee: Mapped["Employee"] = relationship()  # noqa: F821
    workspace: Mapped["Workspace"] = relationship()  # noqa: F821
