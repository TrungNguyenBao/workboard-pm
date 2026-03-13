import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import PORTABLE_JSONB, Base
from app.models.base import TimestampMixin


class ReviewFeedback(Base, TimestampMixin):
    __tablename__ = "review_feedback"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    review_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("performance_reviews.id", ondelete="CASCADE"), index=True)
    from_employee_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("employees.id"))
    relationship_type: Mapped[str] = mapped_column(String(20))
    responses: Mapped[dict] = mapped_column(PORTABLE_JSONB, default=dict)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)
