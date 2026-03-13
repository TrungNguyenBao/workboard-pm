import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import TSVECTOR as PG_TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TypeDecorator

from app.core.database import PORTABLE_JSONB, Base
from app.models.base import SoftDeleteMixin, TimestampMixin


class TSVECTOR(TypeDecorator):
    """PostgreSQL TSVECTOR that degrades to Text on SQLite (for tests)."""
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_TSVECTOR())
        return dialect.type_descriptor(Text())


class Task(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id"), index=True)
    section_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("sections.id"), nullable=True, index=True
    )
    assignee_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )
    created_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("tasks.id"), nullable=True, index=True
    )

    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="incomplete", index=True)
    priority: Mapped[str] = mapped_column(String(20), default="none", index=True)
    position: Mapped[float] = mapped_column(default=65536.0)
    start_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    due_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Recurrence fields
    recurrence_rule: Mapped[str | None] = mapped_column(String(50), nullable=True)
    recurrence_cron_expr: Mapped[str | None] = mapped_column(String(100), nullable=True)
    recurrence_end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    parent_recurring_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True, index=True
    )
    last_generated_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Full-text search vector (populated by trigger)
    search_vector: Mapped[str | None] = mapped_column(TSVECTOR, nullable=True)

    # Custom fields (JSONB map of field_definition_id -> value)
    custom_fields: Mapped[dict | None] = mapped_column(PORTABLE_JSONB, nullable=True)

    # Agile fields
    sprint_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("sprints.id"), nullable=True
    )
    epic_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("tasks.id"), nullable=True
    )
    story_points: Mapped[int | None] = mapped_column(nullable=True)
    task_type: Mapped[str] = mapped_column(String(20), default="task")

    __table_args__ = (
        # GIN index only applies on PostgreSQL; sqlite silently ignores the kwarg
        Index(
            "ix_tasks_search_vector",
            "search_vector",
            postgresql_using="gin",
        ),
        Index("ix_tasks_project_position", "project_id", "position"),
        Index("ix_tasks_section_position", "section_id", "position"),
        Index("ix_tasks_sprint_id", "sprint_id"),
        Index("ix_tasks_epic_id", "epic_id"),
    )

    project: Mapped["Project"] = relationship(back_populates="tasks")  # noqa: F821
    section: Mapped["Section | None"] = relationship(back_populates="tasks")  # noqa: F821
    assignee: Mapped["User | None"] = relationship(  # noqa: F821
        foreign_keys=[assignee_id]
    )
    created_by: Mapped["User"] = relationship(  # noqa: F821
        foreign_keys=[created_by_id]
    )
    parent: Mapped["Task | None"] = relationship(
        back_populates="subtasks", remote_side="Task.id", foreign_keys="Task.parent_id"
    )
    subtasks: Mapped[list["Task"]] = relationship(back_populates="parent", foreign_keys="Task.parent_id")
    recurring_parent: Mapped["Task | None"] = relationship(
        remote_side="Task.id", foreign_keys="Task.parent_recurring_id"
    )
    sprint: Mapped["Sprint | None"] = relationship(back_populates="tasks")  # noqa: F821
    epic: Mapped["Task | None"] = relationship(
        remote_side="Task.id", foreign_keys="Task.epic_id"
    )
    comments: Mapped[list["Comment"]] = relationship(back_populates="task")  # noqa: F821
    attachments: Mapped[list["Attachment"]] = relationship(back_populates="task")  # noqa: F821
    tags: Mapped[list["TaskTag"]] = relationship(back_populates="task")  # noqa: F821
    followers: Mapped[list["TaskFollower"]] = relationship(back_populates="task")
    blocked_by: Mapped[list["TaskDependency"]] = relationship(
        back_populates="blocking_task",
        foreign_keys="TaskDependency.blocking_task_id",
    )
    blocks: Mapped[list["TaskDependency"]] = relationship(
        back_populates="blocked_task",
        foreign_keys="TaskDependency.blocked_task_id",
    )


class TaskDependency(Base, TimestampMixin):
    __tablename__ = "task_dependencies"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    blocking_task_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tasks.id"), index=True
    )
    blocked_task_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tasks.id"), index=True
    )

    __table_args__ = (
        UniqueConstraint(
            "blocking_task_id", "blocked_task_id", name="uq_task_dependency"
        ),
    )

    blocking_task: Mapped["Task"] = relationship(
        back_populates="blocked_by", foreign_keys=[blocking_task_id]
    )
    blocked_task: Mapped["Task"] = relationship(
        back_populates="blocks", foreign_keys=[blocked_task_id]
    )


class TaskTag(Base):
    __tablename__ = "task_tags"

    task_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tasks.id"), primary_key=True
    )
    tag_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tags.id"), primary_key=True
    )

    task: Mapped["Task"] = relationship(back_populates="tags")
    tag: Mapped["Tag"] = relationship(back_populates="task_tags")  # noqa: F821


class TaskFollower(Base):
    __tablename__ = "task_followers"

    task_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tasks.id"), primary_key=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), primary_key=True
    )

    task: Mapped["Task"] = relationship(back_populates="followers")
    user: Mapped["User"] = relationship()  # noqa: F821
