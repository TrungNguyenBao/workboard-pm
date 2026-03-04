"""add_recruitment_pipeline_tables

Revision ID: 0010
Revises: 0009
Create Date: 2026-03-04

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = '0010'
down_revision: Union[str, Sequence[str], None] = '0009'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create recruitment pipeline tables: recruitment_requests, candidates, interviews, offers, onboarding_checklists."""
    op.create_table(
        'recruitment_requests',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('department_id', sa.Uuid(), nullable=False),
        sa.Column('position_id', sa.Uuid(), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('reason', sa.String(length=500), nullable=False),
        sa.Column('requirements', sa.Text(), nullable=True),
        sa.Column('deadline', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='open'),
        sa.Column('requester_id', sa.Uuid(), nullable=False),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id']),
        sa.ForeignKeyConstraint(['position_id'], ['positions.id']),
        sa.ForeignKeyConstraint(['requester_id'], ['users.id']),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_recruitment_requests_department_id', 'recruitment_requests', ['department_id'])
    op.create_index('ix_recruitment_requests_workspace_id', 'recruitment_requests', ['workspace_id'])

    op.create_table(
        'candidates',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('recruitment_request_id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('resume_url', sa.String(length=500), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='applied'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['recruitment_request_id'], ['recruitment_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_candidates_recruitment_request_id', 'candidates', ['recruitment_request_id'])
    op.create_index('ix_candidates_workspace_id', 'candidates', ['workspace_id'])

    op.create_table(
        'interviews',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('candidate_id', sa.Uuid(), nullable=False),
        sa.Column('interviewer_id', sa.Uuid(), nullable=True),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='scheduled'),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['candidate_id'], ['candidates.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['interviewer_id'], ['employees.id']),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_interviews_candidate_id', 'interviews', ['candidate_id'])
    op.create_index('ix_interviews_workspace_id', 'interviews', ['workspace_id'])

    op.create_table(
        'offers',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('candidate_id', sa.Uuid(), nullable=False),
        sa.Column('position_title', sa.String(length=255), nullable=False),
        sa.Column('offered_salary', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('expiry_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['candidate_id'], ['candidates.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_offers_candidate_id', 'offers', ['candidate_id'])
    op.create_index('ix_offers_workspace_id', 'offers', ['workspace_id'])

    op.create_table(
        'onboarding_checklists',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('employee_id', sa.Uuid(), nullable=False),
        sa.Column('task_name', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('assigned_to_id', sa.Uuid(), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['assigned_to_id'], ['employees.id']),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_onboarding_checklists_employee_id', 'onboarding_checklists', ['employee_id'])
    op.create_index('ix_onboarding_checklists_workspace_id', 'onboarding_checklists', ['workspace_id'])


def downgrade() -> None:
    op.drop_index('ix_onboarding_checklists_workspace_id', table_name='onboarding_checklists')
    op.drop_index('ix_onboarding_checklists_employee_id', table_name='onboarding_checklists')
    op.drop_table('onboarding_checklists')
    op.drop_index('ix_offers_workspace_id', table_name='offers')
    op.drop_index('ix_offers_candidate_id', table_name='offers')
    op.drop_table('offers')
    op.drop_index('ix_interviews_workspace_id', table_name='interviews')
    op.drop_index('ix_interviews_candidate_id', table_name='interviews')
    op.drop_table('interviews')
    op.drop_index('ix_candidates_workspace_id', table_name='candidates')
    op.drop_index('ix_candidates_recruitment_request_id', table_name='candidates')
    op.drop_table('candidates')
    op.drop_index('ix_recruitment_requests_workspace_id', table_name='recruitment_requests')
    op.drop_index('ix_recruitment_requests_department_id', table_name='recruitment_requests')
    op.drop_table('recruitment_requests')
