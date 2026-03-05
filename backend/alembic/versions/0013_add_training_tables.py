"""add_training_tables

Revision ID: 0013
Revises: 0012
Create Date: 2026-03-04

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = '0013'
down_revision: Union[str, Sequence[str], None] = '0012'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create training_programs and training_enrollments tables."""
    op.create_table(
        'training_programs',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('budget', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('trainer', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='planned'),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_training_programs_workspace_id', 'training_programs', ['workspace_id'])

    op.create_table(
        'training_enrollments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('program_id', sa.Uuid(), nullable=False),
        sa.Column('employee_id', sa.Uuid(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='enrolled'),
        sa.Column('completion_date', sa.Date(), nullable=True),
        sa.Column('score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['program_id'], ['training_programs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('program_id', 'employee_id', name='uq_enrollment_program_employee'),
    )
    op.create_index('ix_training_enrollments_program_id', 'training_enrollments', ['program_id'])
    op.create_index('ix_training_enrollments_employee_id', 'training_enrollments', ['employee_id'])
    op.create_index('ix_training_enrollments_workspace_id', 'training_enrollments', ['workspace_id'])


def downgrade() -> None:
    op.drop_index('ix_training_enrollments_workspace_id', table_name='training_enrollments')
    op.drop_index('ix_training_enrollments_employee_id', table_name='training_enrollments')
    op.drop_index('ix_training_enrollments_program_id', table_name='training_enrollments')
    op.drop_table('training_enrollments')

    op.drop_index('ix_training_programs_workspace_id', table_name='training_programs')
    op.drop_table('training_programs')
