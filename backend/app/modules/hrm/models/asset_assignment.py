import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class AssetAssignment(Base, TimestampMixin):
    __tablename__ = "asset_assignments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    asset_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("assets.id", ondelete="CASCADE"), index=True)
    employee_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"), index=True)
    assigned_date: Mapped[date] = mapped_column(Date)
    returned_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    condition_on_assign: Mapped[str] = mapped_column(String(20), default="good", server_default="good")
    condition_on_return: Mapped[str | None] = mapped_column(String(20), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)

    asset: Mapped["Asset"] = relationship(back_populates="assignments")  # noqa: F821
    employee: Mapped["Employee"] = relationship()  # noqa: F821
    workspace: Mapped["Workspace"] = relationship()  # noqa: F821
