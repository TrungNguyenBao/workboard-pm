import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import SoftDeleteMixin, TimestampMixin


class Goal(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "goals"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))

    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="on_track")
    progress_value: Mapped[float] = mapped_column(Float, default=0.0)
    calculation_method: Mapped[str] = mapped_column(String(10), default="manual")
    color: Mapped[str] = mapped_column(String(7), default="#5E6AD2")
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    owner: Mapped["User"] = relationship(foreign_keys=[owner_id])  # noqa: F821
    project_links: Mapped[list["GoalProjectLink"]] = relationship(
        back_populates="goal", cascade="all, delete-orphan"
    )
    task_links: Mapped[list["GoalTaskLink"]] = relationship(
        back_populates="goal", cascade="all, delete-orphan"
    )


class GoalProjectLink(Base):
    __tablename__ = "goal_project_links"

    goal_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("goals.id", ondelete="CASCADE"), primary_key=True
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    goal: Mapped["Goal"] = relationship(back_populates="project_links")
    project: Mapped["Project"] = relationship()  # noqa: F821


class GoalTaskLink(Base):
    __tablename__ = "goal_task_links"

    goal_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("goals.id", ondelete="CASCADE"), primary_key=True
    )
    task_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    goal: Mapped["Goal"] = relationship(back_populates="task_links")
    task: Mapped["Task"] = relationship()  # noqa: F821
