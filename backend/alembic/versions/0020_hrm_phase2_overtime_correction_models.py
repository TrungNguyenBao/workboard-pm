"""hrm phase2 overtime correction models

Revision ID: 0020
Revises: 0019
Create Date: 2026-03-09

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0020"
down_revision = "0019"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create overtime_requests table
    op.create_table(
        "overtime_requests",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("employee_id", sa.UUID(), nullable=False),
        sa.Column("workspace_id", sa.UUID(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("planned_hours", sa.Numeric(4, 2), nullable=False),
        sa.Column("reason", sa.String(500), nullable=False),
        sa.Column("status", sa.String(20), server_default="pending", nullable=False),
        sa.Column("approved_by_id", sa.UUID(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"]),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.ForeignKeyConstraint(["approved_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_overtime_requests_employee_id", "overtime_requests", ["employee_id"])
    op.create_index("ix_overtime_requests_workspace_id", "overtime_requests", ["workspace_id"])

    # Create attendance_corrections table
    op.create_table(
        "attendance_corrections",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("attendance_record_id", sa.UUID(), nullable=False),
        sa.Column("employee_id", sa.UUID(), nullable=False),
        sa.Column("workspace_id", sa.UUID(), nullable=False),
        sa.Column("original_check_in", sa.Time(), nullable=True),
        sa.Column("original_check_out", sa.Time(), nullable=True),
        sa.Column("corrected_check_in", sa.Time(), nullable=True),
        sa.Column("corrected_check_out", sa.Time(), nullable=True),
        sa.Column("reason", sa.String(500), nullable=False),
        sa.Column("status", sa.String(20), server_default="pending", nullable=False),
        sa.Column("approved_by_id", sa.UUID(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["attendance_record_id"], ["attendance_records.id"]),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"]),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.ForeignKeyConstraint(["approved_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_attendance_corrections_attendance_record_id", "attendance_corrections", ["attendance_record_id"])
    op.create_index("ix_attendance_corrections_employee_id", "attendance_corrections", ["employee_id"])
    op.create_index("ix_attendance_corrections_workspace_id", "attendance_corrections", ["workspace_id"])

    # Add ot_pay and dependents to payroll_records
    op.add_column("payroll_records", sa.Column("ot_pay", sa.Numeric(12, 2), nullable=True))
    op.add_column(
        "payroll_records",
        sa.Column("dependents", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("payroll_records", "dependents")
    op.drop_column("payroll_records", "ot_pay")

    op.drop_index("ix_attendance_corrections_workspace_id", table_name="attendance_corrections")
    op.drop_index("ix_attendance_corrections_employee_id", table_name="attendance_corrections")
    op.drop_index("ix_attendance_corrections_attendance_record_id", table_name="attendance_corrections")
    op.drop_table("attendance_corrections")

    op.drop_index("ix_overtime_requests_workspace_id", table_name="overtime_requests")
    op.drop_index("ix_overtime_requests_employee_id", table_name="overtime_requests")
    op.drop_table("overtime_requests")
