"""add_crm_leads_accounts_activities_campaigns_tickets

Revision ID: 0016
Revises: 0015
Create Date: 2026-03-06

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = '0016'
down_revision: Union[str, Sequence[str], None] = '0015'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add CRM module tables: campaigns, accounts, leads, activities, tickets + alter contacts/deals."""

    # --- campaigns (must come before leads due to FK) ---
    op.create_table('campaigns',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('budget', sa.Float(), nullable=False, server_default='0'),
        sa.Column('actual_cost', sa.Float(), nullable=False, server_default='0'),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='draft'),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_campaigns_workspace_id', 'campaigns', ['workspace_id'])

    # --- accounts ---
    op.create_table('accounts',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('industry', sa.String(length=100), nullable=True),
        sa.Column('total_revenue', sa.Float(), nullable=False, server_default='0'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('website', sa.String(length=500), nullable=True),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_accounts_workspace_id', 'accounts', ['workspace_id'])

    # --- leads ---
    op.create_table('leads',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('source', sa.String(length=50), nullable=False, server_default='manual'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='new'),
        sa.Column('score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('owner_id', sa.Uuid(), nullable=True),
        sa.Column('campaign_id', sa.Uuid(), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id']),
        sa.ForeignKeyConstraint(['campaign_id'], ['campaigns.id']),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_leads_workspace_id', 'leads', ['workspace_id'])
    op.create_index('ix_leads_owner_id', 'leads', ['owner_id'])
    op.create_index('ix_leads_campaign_id', 'leads', ['campaign_id'])

    # --- crm_activities ---
    op.create_table('crm_activities',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=True),
        sa.Column('contact_id', sa.Uuid(), nullable=True),
        sa.Column('deal_id', sa.Uuid(), nullable=True),
        sa.Column('lead_id', sa.Uuid(), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id']),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id']),
        sa.ForeignKeyConstraint(['deal_id'], ['deals.id']),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id']),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_crm_activities_workspace_id', 'crm_activities', ['workspace_id'])
    op.create_index('ix_crm_activities_owner_id', 'crm_activities', ['owner_id'])
    op.create_index('ix_crm_activities_contact_id', 'crm_activities', ['contact_id'])
    op.create_index('ix_crm_activities_deal_id', 'crm_activities', ['deal_id'])
    op.create_index('ix_crm_activities_lead_id', 'crm_activities', ['lead_id'])

    # --- crm_tickets ---
    op.create_table('crm_tickets',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('priority', sa.String(length=50), nullable=False, server_default='medium'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='open'),
        sa.Column('contact_id', sa.Uuid(), nullable=True),
        sa.Column('account_id', sa.Uuid(), nullable=True),
        sa.Column('assigned_to', sa.Uuid(), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id']),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id']),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id']),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_crm_tickets_workspace_id', 'crm_tickets', ['workspace_id'])
    op.create_index('ix_crm_tickets_contact_id', 'crm_tickets', ['contact_id'])
    op.create_index('ix_crm_tickets_account_id', 'crm_tickets', ['account_id'])
    op.create_index('ix_crm_tickets_assigned_to', 'crm_tickets', ['assigned_to'])

    # --- alter contacts: add account_id FK ---
    op.add_column('contacts', sa.Column('account_id', sa.Uuid(), nullable=True))
    op.create_index('ix_contacts_account_id', 'contacts', ['account_id'])
    op.create_foreign_key('fk_contacts_account_id', 'contacts', 'accounts', ['account_id'], ['id'])

    # --- alter deals: add probability, expected_close_date, account_id, lead_id ---
    op.add_column('deals', sa.Column('probability', sa.Float(), nullable=False, server_default='0'))
    op.add_column('deals', sa.Column('expected_close_date', sa.Date(), nullable=True))
    op.add_column('deals', sa.Column('account_id', sa.Uuid(), nullable=True))
    op.add_column('deals', sa.Column('lead_id', sa.Uuid(), nullable=True))
    op.create_index('ix_deals_account_id', 'deals', ['account_id'])
    op.create_index('ix_deals_lead_id', 'deals', ['lead_id'])
    op.create_foreign_key('fk_deals_account_id', 'deals', 'accounts', ['account_id'], ['id'])
    op.create_foreign_key('fk_deals_lead_id', 'deals', 'leads', ['lead_id'], ['id'])


def downgrade() -> None:
    """Remove CRM expansion tables and columns."""
    # Revert deals alterations
    op.drop_constraint('fk_deals_lead_id', 'deals', type_='foreignkey')
    op.drop_constraint('fk_deals_account_id', 'deals', type_='foreignkey')
    op.drop_index('ix_deals_lead_id', table_name='deals')
    op.drop_index('ix_deals_account_id', table_name='deals')
    op.drop_column('deals', 'lead_id')
    op.drop_column('deals', 'account_id')
    op.drop_column('deals', 'expected_close_date')
    op.drop_column('deals', 'probability')

    # Revert contacts alterations
    op.drop_constraint('fk_contacts_account_id', 'contacts', type_='foreignkey')
    op.drop_index('ix_contacts_account_id', table_name='contacts')
    op.drop_column('contacts', 'account_id')

    # Drop new tables in reverse order
    op.drop_table('crm_tickets')
    op.drop_table('crm_activities')
    op.drop_table('leads')
    op.drop_table('accounts')
    op.drop_table('campaigns')
