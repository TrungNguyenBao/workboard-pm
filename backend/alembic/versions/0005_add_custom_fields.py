"""add custom fields

Revision ID: 0005
Revises: 0004
Create Date: 2026-02-27

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add JSONB custom_fields column to tasks
    op.add_column(
        "tasks",
        sa.Column("custom_fields", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )

    # Create custom_field_definitions table
    op.create_table(
        "custom_field_definitions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "project_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("field_type", sa.String(20), nullable=False),
        sa.Column("required", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("options", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("position", sa.Float(), nullable=False, server_default="65536.0"),
        sa.Column(
            "created_by_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_index("ix_cfd_project_id", "custom_field_definitions", ["project_id"])
    op.create_index(
        "ix_cfd_project_position",
        "custom_field_definitions",
        ["project_id", "position"],
    )
    op.create_index(
        "ix_cfd_deleted_at",
        "custom_field_definitions",
        ["deleted_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_cfd_deleted_at", table_name="custom_field_definitions")
    op.drop_index("ix_cfd_project_position", table_name="custom_field_definitions")
    op.drop_index("ix_cfd_project_id", table_name="custom_field_definitions")
    op.drop_table("custom_field_definitions")
    op.drop_column("tasks", "custom_fields")
