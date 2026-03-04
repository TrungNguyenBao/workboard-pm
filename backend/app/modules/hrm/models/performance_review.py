import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin


class PerformanceReview(Base, TimestampMixin):
    __tablename__ = "performance_reviews"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    employee_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"), index=True)
    reviewer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("employees.id"))
    period: Mapped[str] = mapped_column(String(7))
    overall_score: Mapped[Decimal | None] = mapped_column(Numeric(3, 1), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)
