"""hrm phase3 documents and interview room/panel fields

Revision ID: 0021
Revises: 0020
Create Date: 2026-03-09

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0021"
down_revision = "0020"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create hrm_documents table
    op.create_table(
        "hrm_documents",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.UUID(), nullable=False),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("file_path", sa.String(500), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("mime_type", sa.String(100), nullable=False),
        sa.Column("uploaded_by_id", sa.UUID(), nullable=False),
        sa.Column("workspace_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["uploaded_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_hrm_documents_workspace_id", "hrm_documents", ["workspace_id"])
    op.create_index("ix_hrm_documents_entity", "hrm_documents", ["entity_type", "entity_id"])

    # Add room and panel_ids to interviews table
    op.add_column("interviews", sa.Column("room", sa.String(100), nullable=True))
    op.add_column("interviews", sa.Column("panel_ids", postgresql.JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column("interviews", "panel_ids")
    op.drop_column("interviews", "room")

    op.drop_index("ix_hrm_documents_entity", table_name="hrm_documents")
    op.drop_index("ix_hrm_documents_workspace_id", table_name="hrm_documents")
    op.drop_table("hrm_documents")
