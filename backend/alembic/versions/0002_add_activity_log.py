"""add activity log

Revision ID: 0002
Revises: 0001
Create Date: 2026-02-27

"""
from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "activity_logs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("workspace_id", sa.UUID(), nullable=False),
        sa.Column("project_id", sa.UUID(), nullable=True),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.UUID(), nullable=False),
        sa.Column("actor_id", sa.UUID(), nullable=False),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("changes", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_activity_logs_workspace_id", "activity_logs", ["workspace_id"])
    op.create_index("ix_activity_logs_project_id", "activity_logs", ["project_id"])
    op.create_index("ix_activity_logs_entity_id", "activity_logs", ["entity_id"])
    op.create_index(
        "ix_activity_logs_entity", "activity_logs", ["entity_type", "entity_id"]
    )
    op.create_index(
        "ix_activity_logs_created_at",
        "activity_logs",
        [sa.text("created_at DESC")],
    )


def downgrade() -> None:
    op.drop_table("activity_logs")
