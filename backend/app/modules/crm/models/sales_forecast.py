import uuid

from sqlalchemy import Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin


class SalesForecast(Base, TimestampMixin):
    __tablename__ = "crm_sales_forecasts"
    __table_args__ = (
        UniqueConstraint("workspace_id", "owner_id", "period", name="uq_forecast_workspace_owner_period"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    period: Mapped[str] = mapped_column(String(7))  # YYYY-MM
    target_amount: Mapped[float] = mapped_column(Float, default=0.0)
    committed_amount: Mapped[float] = mapped_column(Float, default=0.0)
    best_case_amount: Mapped[float] = mapped_column(Float, default=0.0)
    closed_amount: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(10), default="open")
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
