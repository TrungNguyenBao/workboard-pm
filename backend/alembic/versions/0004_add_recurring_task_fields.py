"""add recurring task fields

Revision ID: 0004
Revises: 0003
Create Date: 2026-02-27

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tasks", sa.Column("recurrence_rule", sa.String(50), nullable=True))
    op.add_column("tasks", sa.Column("recurrence_cron_expr", sa.String(100), nullable=True))
    op.add_column("tasks", sa.Column("recurrence_end_date", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "tasks",
        sa.Column(
            "parent_recurring_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="CASCADE"),
            nullable=True,
        ),
    )
    op.add_column("tasks", sa.Column("last_generated_date", sa.DateTime(timezone=True), nullable=True))

    op.create_index(
        "ix_tasks_recurrence_rule",
        "tasks",
        ["recurrence_rule"],
        postgresql_where=sa.text("recurrence_rule IS NOT NULL"),
    )
    op.create_index("ix_tasks_parent_recurring_id", "tasks", ["parent_recurring_id"])


def downgrade() -> None:
    op.drop_index("ix_tasks_parent_recurring_id", table_name="tasks")
    op.drop_index("ix_tasks_recurrence_rule", table_name="tasks")
    op.drop_column("tasks", "last_generated_date")
    op.drop_column("tasks", "parent_recurring_id")
    op.drop_column("tasks", "recurrence_end_date")
    op.drop_column("tasks", "recurrence_cron_expr")
    op.drop_column("tasks", "recurrence_rule")
