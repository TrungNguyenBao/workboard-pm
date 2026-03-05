"""add_offboarding_tables

Revision ID: 0014
Revises: 0012
Create Date: 2026-03-04

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '0014'
down_revision: Union[str, Sequence[str], None] = '0012'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create resignations, handover_tasks, exit_interviews tables."""
    op.create_table(
        'resignations',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('employee_id', sa.Uuid(), nullable=False),
        sa.Column('resignation_date', sa.Date(), nullable=False),
        sa.Column('last_working_day', sa.Date(), nullable=False),
        sa.Column('reason', sa.String(length=500), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('approved_by_id', sa.Uuid(), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['approved_by_id'], ['users.id']),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_resignations_employee_id', 'resignations', ['employee_id'])
    op.create_index('ix_resignations_workspace_id', 'resignations', ['workspace_id'])

    op.create_table(
        'handover_tasks',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('resignation_id', sa.Uuid(), nullable=False),
        sa.Column('task_name', sa.String(length=255), nullable=False),
        sa.Column('from_employee_id', sa.Uuid(), nullable=True),
        sa.Column('to_employee_id', sa.Uuid(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['from_employee_id'], ['employees.id']),
        sa.ForeignKeyConstraint(['resignation_id'], ['resignations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['to_employee_id'], ['employees.id']),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_handover_tasks_resignation_id', 'handover_tasks', ['resignation_id'])
    op.create_index('ix_handover_tasks_workspace_id', 'handover_tasks', ['workspace_id'])

    op.create_table(
        'exit_interviews',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('resignation_id', sa.Uuid(), nullable=False),
        sa.Column('interviewer_id', sa.Uuid(), nullable=True),
        sa.Column('feedback', postgresql.JSONB(), nullable=True),
        sa.Column('conducted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['interviewer_id'], ['employees.id']),
        sa.ForeignKeyConstraint(['resignation_id'], ['resignations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('resignation_id'),
    )
    op.create_index('ix_exit_interviews_resignation_id', 'exit_interviews', ['resignation_id'])
    op.create_index('ix_exit_interviews_workspace_id', 'exit_interviews', ['workspace_id'])


def downgrade() -> None:
    op.drop_index('ix_exit_interviews_workspace_id', table_name='exit_interviews')
    op.drop_index('ix_exit_interviews_resignation_id', table_name='exit_interviews')
    op.drop_table('exit_interviews')

    op.drop_index('ix_handover_tasks_workspace_id', table_name='handover_tasks')
    op.drop_index('ix_handover_tasks_resignation_id', table_name='handover_tasks')
    op.drop_table('handover_tasks')

    op.drop_index('ix_resignations_workspace_id', table_name='resignations')
    op.drop_index('ix_resignations_employee_id', table_name='resignations')
    op.drop_table('resignations')
