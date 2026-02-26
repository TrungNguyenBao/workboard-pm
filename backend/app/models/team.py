import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Team(Base, TimestampMixin):
    __tablename__ = "teams"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True, default="#5E6AD2")

    workspace: Mapped["Workspace"] = relationship(back_populates="teams")  # noqa: F821
    memberships: Mapped[list["TeamMembership"]] = relationship(back_populates="team")
    projects: Mapped[list["Project"]] = relationship(back_populates="team")  # noqa: F821


class TeamMembership(Base, TimestampMixin):
    __tablename__ = "team_memberships"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    team_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("teams.id"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    role: Mapped[str] = mapped_column(String(20), default="member")

    team: Mapped["Team"] = relationship(back_populates="memberships")
    user: Mapped["User"] = relationship()  # noqa: F821
