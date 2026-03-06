import uuid
from datetime import date

from sqlalchemy import Date, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Campaign(Base, TimestampMixin):
    __tablename__ = "campaigns"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    type: Mapped[str] = mapped_column(String(50))  # email/ads/event/social
    budget: Mapped[float] = mapped_column(Float, default=0.0)
    actual_cost: Mapped[float] = mapped_column(Float, default=0.0)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="draft")
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)

    workspace: Mapped["Workspace"] = relationship()  # noqa: F821
