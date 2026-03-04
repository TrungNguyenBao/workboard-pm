"""add_performance_management_tables

Revision ID: 0012
Revises: 0011
Create Date: 2026-03-04

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '0012'
down_revision: Union[str, Sequence[str], None] = '0011'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create kpi_templates, kpi_assignments, performance_reviews, review_feedback tables."""
    op.create_table(
        'kpi_templates',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('measurement_unit', sa.String(length=50), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_kpi_templates_workspace_id', 'kpi_templates', ['workspace_id'])

    op.create_table(
        'kpi_assignments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('template_id', sa.Uuid(), nullable=False),
        sa.Column('employee_id', sa.Uuid(), nullable=False),
        sa.Column('period', sa.String(length=7), nullable=False),
        sa.Column('target_value', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('actual_value', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('weight', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['template_id'], ['kpi_templates.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_kpi_assignments_template_id', 'kpi_assignments', ['template_id'])
    op.create_index('ix_kpi_assignments_employee_id', 'kpi_assignments', ['employee_id'])
    op.create_index('ix_kpi_assignments_workspace_id', 'kpi_assignments', ['workspace_id'])

    op.create_table(
        'performance_reviews',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('employee_id', sa.Uuid(), nullable=False),
        sa.Column('reviewer_id', sa.Uuid(), nullable=False),
        sa.Column('period', sa.String(length=7), nullable=False),
        sa.Column('overall_score', sa.Numeric(precision=3, scale=1), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'),
        sa.Column('comments', sa.Text(), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewer_id'], ['employees.id']),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_performance_reviews_employee_id', 'performance_reviews', ['employee_id'])
    op.create_index('ix_performance_reviews_workspace_id', 'performance_reviews', ['workspace_id'])

    op.create_table(
        'review_feedback',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('review_id', sa.Uuid(), nullable=False),
        sa.Column('from_employee_id', sa.Uuid(), nullable=False),
        sa.Column('relationship_type', sa.String(length=20), nullable=False),
        sa.Column('scores', postgresql.JSONB(), nullable=True),
        sa.Column('comments', sa.Text(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['from_employee_id'], ['employees.id']),
        sa.ForeignKeyConstraint(['review_id'], ['performance_reviews.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_review_feedback_review_id', 'review_feedback', ['review_id'])
    op.create_index('ix_review_feedback_workspace_id', 'review_feedback', ['workspace_id'])


def downgrade() -> None:
    op.drop_index('ix_review_feedback_workspace_id', table_name='review_feedback')
    op.drop_index('ix_review_feedback_review_id', table_name='review_feedback')
    op.drop_table('review_feedback')

    op.drop_index('ix_performance_reviews_workspace_id', table_name='performance_reviews')
    op.drop_index('ix_performance_reviews_employee_id', table_name='performance_reviews')
    op.drop_table('performance_reviews')

    op.drop_index('ix_kpi_assignments_workspace_id', table_name='kpi_assignments')
    op.drop_index('ix_kpi_assignments_employee_id', table_name='kpi_assignments')
    op.drop_index('ix_kpi_assignments_template_id', table_name='kpi_assignments')
    op.drop_table('kpi_assignments')

    op.drop_index('ix_kpi_templates_workspace_id', table_name='kpi_templates')
    op.drop_table('kpi_templates')
