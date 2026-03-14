import uuid

from sqlalchemy import JSON, Boolean, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin


class CrmCustomField(Base, TimestampMixin):
    __tablename__ = "crm_custom_fields"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    entity_type: Mapped[str] = mapped_column(String(30))
    field_name: Mapped[str] = mapped_column(String(100))
    field_label: Mapped[str] = mapped_column(String(255))
    field_type: Mapped[str] = mapped_column(String(20), default="text")
    options: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_required: Mapped[bool] = mapped_column(Boolean, default=False)
    position: Mapped[int] = mapped_column(Integer, default=0)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)

    __table_args__ = (
        UniqueConstraint("workspace_id", "entity_type", "field_name", name="uq_crm_custom_field"),
    )
