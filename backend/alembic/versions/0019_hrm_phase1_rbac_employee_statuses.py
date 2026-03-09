"""hrm phase1 rbac employee statuses

Revision ID: 0019
Revises: 0018
Create Date: 2026-03-09

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0019"
down_revision = "0018"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # workspace_memberships: add hrm_role
    op.add_column(
        "workspace_memberships",
        sa.Column("hrm_role", sa.String(30), nullable=True),
    )

    # employees: add 7 personal info + status fields
    op.add_column("employees", sa.Column("date_of_birth", sa.Date(), nullable=True))
    op.add_column("employees", sa.Column("address", sa.Text(), nullable=True))
    op.add_column("employees", sa.Column("national_id", sa.String(50), nullable=True))
    op.add_column("employees", sa.Column("bank_account_number", sa.String(50), nullable=True))
    op.add_column("employees", sa.Column("bank_name", sa.String(255), nullable=True))
    op.add_column("employees", sa.Column("phone", sa.String(20), nullable=True))
    op.add_column(
        "employees",
        sa.Column(
            "employee_status",
            sa.String(20),
            nullable=False,
            server_default="active",
        ),
    )

    # departments: add code column
    op.add_column(
        "departments",
        sa.Column("code", sa.String(20), nullable=True),
    )
    op.create_unique_constraint(
        "uq_departments_workspace_code", "departments", ["workspace_id", "code"]
    )

    # offers: add contract_type + benefits
    op.add_column("offers", sa.Column("contract_type", sa.String(50), nullable=True))
    op.add_column(
        "offers",
        sa.Column("benefits", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )

    # recruitment_requests: add salary range fields + change status default
    op.add_column(
        "recruitment_requests",
        sa.Column("salary_range_min", sa.Numeric(12, 2), nullable=True),
    )
    op.add_column(
        "recruitment_requests",
        sa.Column("salary_range_max", sa.Numeric(12, 2), nullable=True),
    )
    op.alter_column(
        "recruitment_requests",
        "status",
        existing_type=sa.String(20),
        server_default="draft",
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "recruitment_requests",
        "status",
        existing_type=sa.String(20),
        server_default="open",
        existing_nullable=False,
    )
    op.drop_column("recruitment_requests", "salary_range_max")
    op.drop_column("recruitment_requests", "salary_range_min")

    op.drop_column("offers", "benefits")
    op.drop_column("offers", "contract_type")

    op.drop_constraint("uq_departments_workspace_code", "departments", type_="unique")
    op.drop_column("departments", "code")

    op.drop_column("employees", "employee_status")
    op.drop_column("employees", "phone")
    op.drop_column("employees", "bank_name")
    op.drop_column("employees", "bank_account_number")
    op.drop_column("employees", "national_id")
    op.drop_column("employees", "address")
    op.drop_column("employees", "date_of_birth")

    op.drop_column("workspace_memberships", "hrm_role")
