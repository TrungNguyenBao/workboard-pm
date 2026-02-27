"""add task start_date

Revision ID: 0003
Revises: 0002
Create Date: 2026-02-27

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_tasks_start_date", "tasks", ["start_date"])


def downgrade() -> None:
    op.drop_index("ix_tasks_start_date", table_name="tasks")
    op.drop_column("tasks", "start_date")
