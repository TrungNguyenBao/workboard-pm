import uuid

from sqlalchemy import ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class PurchaseItem(Base, TimestampMixin):
    __tablename__ = "purchase_items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("purchase_requests.id", ondelete="CASCADE"), index=True)
    item_name: Mapped[str] = mapped_column(String(255))
    quantity: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), default=0, server_default="0")
    total: Mapped[float] = mapped_column(Numeric(12, 2), default=0, server_default="0")
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)

    request: Mapped["PurchaseRequest"] = relationship(back_populates="items")  # noqa: F821
    workspace: Mapped["Workspace"] = relationship()  # noqa: F821
