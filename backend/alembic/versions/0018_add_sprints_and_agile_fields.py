"""add sprints and agile fields

Revision ID: 0018
Revises: 0017
Create Date: 2026-03-09

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0018"
down_revision = "0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create sprints table
    op.create_table(
        "sprints",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("project_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("goal", sa.Text(), nullable=True),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="planning"),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_sprints_project_id", "sprints", ["project_id"])
    op.create_index("ix_sprints_status", "sprints", ["status"])
    op.create_index("ix_sprints_deleted_at", "sprints", ["deleted_at"])

    # Add agile fields to tasks
    op.add_column("tasks", sa.Column(
        "sprint_id", postgresql.UUID(as_uuid=True),
        sa.ForeignKey("sprints.id", ondelete="SET NULL"), nullable=True))
    op.add_column("tasks", sa.Column(
        "epic_id", postgresql.UUID(as_uuid=True),
        sa.ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True))
    op.add_column("tasks", sa.Column("story_points", sa.Integer(), nullable=True))
    op.add_column("tasks", sa.Column(
        "task_type", sa.String(20), nullable=False, server_default="task"))
    op.create_index("ix_tasks_sprint_id", "tasks", ["sprint_id"])
    op.create_index("ix_tasks_epic_id", "tasks", ["epic_id"])

    # Add wip_limit to sections
    op.add_column("sections", sa.Column("wip_limit", sa.Integer(), nullable=True))

    # Add project_type to projects
    op.add_column("projects", sa.Column(
        "project_type", sa.String(20), nullable=False, server_default="kanban"))


def downgrade() -> None:
    op.drop_column("projects", "project_type")
    op.drop_column("sections", "wip_limit")
    op.drop_index("ix_tasks_epic_id", table_name="tasks")
    op.drop_index("ix_tasks_sprint_id", table_name="tasks")
    op.drop_column("tasks", "task_type")
    op.drop_column("tasks", "story_points")
    op.drop_column("tasks", "epic_id")
    op.drop_column("tasks", "sprint_id")
    op.drop_index("ix_sprints_deleted_at", table_name="sprints")
    op.drop_index("ix_sprints_status", table_name="sprints")
    op.drop_index("ix_sprints_project_id", table_name="sprints")
    op.drop_table("sprints")
