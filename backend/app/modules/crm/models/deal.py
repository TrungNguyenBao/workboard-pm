import uuid
from datetime import date

from sqlalchemy import Date, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Deal(Base, TimestampMixin):
    __tablename__ = "deals"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255))
    value: Mapped[float] = mapped_column(Float, default=0.0)
    stage: Mapped[str] = mapped_column(String(50), default="lead")
    probability: Mapped[float] = mapped_column(Float, default=0.0)
    expected_close_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    contact_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("contacts.id"), nullable=True, index=True)
    account_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("accounts.id"), nullable=True, index=True)
    lead_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("leads.id"), nullable=True, index=True)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)

    contact: Mapped["Contact | None"] = relationship(back_populates="deals")  # noqa: F821
    workspace: Mapped["Workspace"] = relationship()  # noqa: F821
