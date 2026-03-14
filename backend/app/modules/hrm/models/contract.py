import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import PORTABLE_JSONB, Base
from app.models.base import TimestampMixin


class EmployeeContract(Base, TimestampMixin):
    __tablename__ = "contracts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), index=True
    )
    contract_type: Mapped[str] = mapped_column(String(50))  # probation / fixed_term / indefinite
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    base_salary: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    allowances: Mapped[dict | None] = mapped_column(PORTABLE_JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active / expired / terminated
    file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)

    employee: Mapped["Employee"] = relationship(back_populates="employee_contracts")  # noqa: F821
    workspace: Mapped["Workspace"] = relationship()  # noqa: F821
