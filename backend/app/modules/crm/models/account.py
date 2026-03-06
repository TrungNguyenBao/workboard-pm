import uuid

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Account(Base, TimestampMixin):
    __tablename__ = "accounts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    total_revenue: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(50), default="active")
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)

    workspace: Mapped["Workspace"] = relationship()  # noqa: F821
    contacts: Mapped[list["Contact"]] = relationship(back_populates="account")  # noqa: F821
