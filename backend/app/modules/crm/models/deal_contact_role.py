import uuid

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin


class DealContactRole(Base, TimestampMixin):
    __tablename__ = "crm_deal_contact_roles"
    __table_args__ = (UniqueConstraint("deal_id", "contact_id", name="uq_crm_deal_contact_roles_deal_contact"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    deal_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("deals.id"), index=True)
    contact_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("contacts.id"), index=True)
    role: Mapped[str] = mapped_column(String(30))  # decision_maker|influencer|champion|user|evaluator
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)
