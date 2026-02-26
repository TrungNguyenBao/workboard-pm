import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Workspace(Base, TimestampMixin):
    __tablename__ = "workspaces"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))

    owner: Mapped["User"] = relationship(foreign_keys=[owner_id])  # noqa: F821
    memberships: Mapped[list["WorkspaceMembership"]] = relationship(
        back_populates="workspace"
    )
    teams: Mapped[list["Team"]] = relationship(back_populates="workspace")  # noqa: F821
    projects: Mapped[list["Project"]] = relationship(back_populates="workspace")  # noqa: F821
    tags: Mapped[list["Tag"]] = relationship(back_populates="workspace")  # noqa: F821


class WorkspaceMembership(Base, TimestampMixin):
    __tablename__ = "workspace_memberships"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    role: Mapped[str] = mapped_column(String(20), default="member")
    invite_token: Mapped[str | None] = mapped_column(
        String(255), nullable=True, unique=True
    )

    workspace: Mapped["Workspace"] = relationship(back_populates="memberships")
    user: Mapped["User"] = relationship(back_populates="workspace_memberships")  # noqa: F821
