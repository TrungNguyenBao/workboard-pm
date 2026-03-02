import uuid

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Tag(Base, TimestampMixin):
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id"), index=True
    )
    name: Mapped[str] = mapped_column(String(100))
    color: Mapped[str] = mapped_column(String(20), default="#5E6AD2")

    __table_args__ = (
        UniqueConstraint("workspace_id", "name", name="uq_tag_workspace_name"),
    )

    workspace: Mapped["Workspace"] = relationship(back_populates="tags")  # noqa: F821
    task_tags: Mapped[list["TaskTag"]] = relationship(back_populates="tag")  # noqa: F821
