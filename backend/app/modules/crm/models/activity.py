import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Activity(Base, TimestampMixin):
    __tablename__ = "crm_activities"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    type: Mapped[str] = mapped_column(String(50))  # call/email/meeting/demo/follow_up
    subject: Mapped[str] = mapped_column(String(255))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    owner_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    contact_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("contacts.id"), nullable=True, index=True)
    deal_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("deals.id"), nullable=True, index=True)
    lead_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("leads.id"), nullable=True, index=True)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)

    workspace: Mapped["Workspace"] = relationship()  # noqa: F821
