"""add_contracts_salary_history

Revision ID: 0009
Revises: 4119e05e2a03
Create Date: 2026-03-04

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '0009'
down_revision: Union[str, Sequence[str], None] = '0008'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add contracts and salary_history tables for HRM module."""
    op.create_table(
        'contracts',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('employee_id', sa.Uuid(), nullable=False),
        sa.Column('contract_type', sa.String(length=50), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('base_salary', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'),
        sa.Column('allowances', postgresql.JSONB(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('file_url', sa.String(length=500), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_contracts_employee_id', 'contracts', ['employee_id'])
    op.create_index('ix_contracts_workspace_id', 'contracts', ['workspace_id'])

    op.create_table(
        'salary_history',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('employee_id', sa.Uuid(), nullable=False),
        sa.Column('effective_date', sa.Date(), nullable=False),
        sa.Column('previous_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('new_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('reason', sa.String(length=255), nullable=False),
        sa.Column('approved_by_id', sa.Uuid(), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['approved_by_id'], ['users.id']),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_salary_history_employee_id', 'salary_history', ['employee_id'])
    op.create_index('ix_salary_history_workspace_id', 'salary_history', ['workspace_id'])


def downgrade() -> None:
    op.drop_index('ix_salary_history_workspace_id', table_name='salary_history')
    op.drop_index('ix_salary_history_employee_id', table_name='salary_history')
    op.drop_table('salary_history')
    op.drop_index('ix_contracts_workspace_id', table_name='contracts')
    op.drop_index('ix_contracts_employee_id', table_name='contracts')
    op.drop_table('contracts')
