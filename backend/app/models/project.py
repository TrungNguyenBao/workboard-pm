import uuid

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import SoftDeleteMixin, TimestampMixin


class Project(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id"), index=True
    )
    team_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("teams.id"), nullable=True, index=True
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    color: Mapped[str] = mapped_column(String(20), default="#5E6AD2")
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    visibility: Mapped[str] = mapped_column(String(20), default="team")
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)

    workspace: Mapped["Workspace"] = relationship(back_populates="projects")  # noqa: F821
    team: Mapped["Team | None"] = relationship(back_populates="projects")  # noqa: F821
    owner: Mapped["User"] = relationship(foreign_keys=[owner_id])  # noqa: F821
    memberships: Mapped[list["ProjectMembership"]] = relationship(back_populates="project")
    sections: Mapped[list["Section"]] = relationship(back_populates="project")
    tasks: Mapped[list["Task"]] = relationship(back_populates="project")  # noqa: F821


class ProjectMembership(Base, TimestampMixin):
    __tablename__ = "project_memberships"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    role: Mapped[str] = mapped_column(String(20), default="editor")

    project: Mapped["Project"] = relationship(back_populates="memberships")
    user: Mapped["User"] = relationship()  # noqa: F821


class Section(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "sections"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    position: Mapped[float] = mapped_column()

    project: Mapped["Project"] = relationship(back_populates="sections")
    tasks: Mapped[list["Task"]] = relationship(back_populates="section")  # noqa: F821
