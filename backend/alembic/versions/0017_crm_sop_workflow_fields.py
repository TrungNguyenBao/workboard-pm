"""crm sop workflow fields

Revision ID: 0017
Revises: 0016
Create Date: 2026-03-06
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = '0017'
down_revision: Union[str, Sequence[str], None] = '0016'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Lead: contacted_at, assigned_at
    op.add_column('leads', sa.Column('contacted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('leads', sa.Column('assigned_at', sa.DateTime(timezone=True), nullable=True))

    # Deal: last_activity_date, loss_reason, closed_at, owner_id, last_updated_by
    op.add_column('deals', sa.Column('last_activity_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('deals', sa.Column('loss_reason', sa.String(255), nullable=True))
    op.add_column('deals', sa.Column('closed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('deals', sa.Column('owner_id', sa.Uuid(), nullable=True))
    op.add_column('deals', sa.Column('last_updated_by', sa.Uuid(), nullable=True))
    op.create_index('ix_deals_owner_id', 'deals', ['owner_id'])
    op.create_foreign_key('fk_deals_owner_id', 'deals', 'users', ['owner_id'], ['id'])
    op.create_foreign_key('fk_deals_last_updated_by', 'deals', 'users', ['last_updated_by'], ['id'])

    # Activity: outcome, next_action_date
    op.add_column('crm_activities', sa.Column('outcome', sa.String(50), nullable=True))
    op.add_column('crm_activities', sa.Column('next_action_date', sa.DateTime(timezone=True), nullable=True))

    # Ticket: resolved_at, closed_at, resolution_notes
    op.add_column('crm_tickets', sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('crm_tickets', sa.Column('closed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('crm_tickets', sa.Column('resolution_notes', sa.Text(), nullable=True))

    # Account: source_deal_id, next_follow_up_date, health_score
    op.add_column('accounts', sa.Column('source_deal_id', sa.Uuid(), nullable=True))
    op.add_column('accounts', sa.Column('next_follow_up_date', sa.Date(), nullable=True))
    op.add_column('accounts', sa.Column('health_score', sa.Integer(), server_default='100', nullable=False))
    op.create_foreign_key('fk_accounts_source_deal_id', 'accounts', 'deals', ['source_deal_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_accounts_source_deal_id', 'accounts', type_='foreignkey')
    op.drop_column('accounts', 'health_score')
    op.drop_column('accounts', 'next_follow_up_date')
    op.drop_column('accounts', 'source_deal_id')

    op.drop_column('crm_tickets', 'resolution_notes')
    op.drop_column('crm_tickets', 'closed_at')
    op.drop_column('crm_tickets', 'resolved_at')

    op.drop_column('crm_activities', 'next_action_date')
    op.drop_column('crm_activities', 'outcome')

    op.drop_constraint('fk_deals_last_updated_by', 'deals', type_='foreignkey')
    op.drop_constraint('fk_deals_owner_id', 'deals', type_='foreignkey')
    op.drop_index('ix_deals_owner_id', 'deals')
    op.drop_column('deals', 'last_updated_by')
    op.drop_column('deals', 'owner_id')
    op.drop_column('deals', 'closed_at')
    op.drop_column('deals', 'loss_reason')
    op.drop_column('deals', 'last_activity_date')

    op.drop_column('leads', 'assigned_at')
    op.drop_column('leads', 'contacted_at')
