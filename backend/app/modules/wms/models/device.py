import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Device(Base, TimestampMixin):
    __tablename__ = "wms_devices"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    serial_number: Mapped[str] = mapped_column(String(255), index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("wms_products.id"), index=True)
    warehouse_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("warehouses.id"), nullable=True, index=True
    )
    status: Mapped[str] = mapped_column(String(20), default="in_stock", index=True)
    notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)

    product: Mapped["Product"] = relationship(back_populates="devices")  # noqa: F821
    warehouse: Mapped["Warehouse | None"] = relationship()  # noqa: F821
    workspace: Mapped["Workspace"] = relationship()  # noqa: F821
