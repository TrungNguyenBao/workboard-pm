"""add_assets_procurement_tables

Revision ID: 0015
Revises: 0013, 0014
Create Date: 2026-03-04

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = '0015'
down_revision: Union[str, Sequence[str], None] = ('0013', '0014')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create assets, asset_assignments, purchase_requests, purchase_items tables."""
    op.create_table(
        'assets',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('serial_number', sa.String(length=100), nullable=True),
        sa.Column('purchase_date', sa.Date(), nullable=True),
        sa.Column('purchase_value', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('current_value', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='available'),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_assets_workspace_id', 'assets', ['workspace_id'])

    op.create_table(
        'asset_assignments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('asset_id', sa.Uuid(), nullable=False),
        sa.Column('employee_id', sa.Uuid(), nullable=False),
        sa.Column('assigned_date', sa.Date(), nullable=False),
        sa.Column('returned_date', sa.Date(), nullable=True),
        sa.Column('condition_on_assign', sa.String(length=20), nullable=False, server_default='good'),
        sa.Column('condition_on_return', sa.String(length=20), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_asset_assignments_asset_id', 'asset_assignments', ['asset_id'])
    op.create_index('ix_asset_assignments_employee_id', 'asset_assignments', ['employee_id'])
    op.create_index('ix_asset_assignments_workspace_id', 'asset_assignments', ['workspace_id'])

    op.create_table(
        'purchase_requests',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('estimated_total', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'),
        sa.Column('requester_id', sa.Uuid(), nullable=False),
        sa.Column('approved_by_id', sa.Uuid(), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['approved_by_id'], ['users.id']),
        sa.ForeignKeyConstraint(['requester_id'], ['users.id']),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_purchase_requests_requester_id', 'purchase_requests', ['requester_id'])
    op.create_index('ix_purchase_requests_workspace_id', 'purchase_requests', ['workspace_id'])

    op.create_table(
        'purchase_items',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('request_id', sa.Uuid(), nullable=False),
        sa.Column('item_name', sa.String(length=255), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('unit_price', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'),
        sa.Column('total', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['request_id'], ['purchase_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_purchase_items_request_id', 'purchase_items', ['request_id'])
    op.create_index('ix_purchase_items_workspace_id', 'purchase_items', ['workspace_id'])


def downgrade() -> None:
    op.drop_index('ix_purchase_items_workspace_id', table_name='purchase_items')
    op.drop_index('ix_purchase_items_request_id', table_name='purchase_items')
    op.drop_table('purchase_items')

    op.drop_index('ix_purchase_requests_workspace_id', table_name='purchase_requests')
    op.drop_index('ix_purchase_requests_requester_id', table_name='purchase_requests')
    op.drop_table('purchase_requests')

    op.drop_index('ix_asset_assignments_workspace_id', table_name='asset_assignments')
    op.drop_index('ix_asset_assignments_employee_id', table_name='asset_assignments')
    op.drop_index('ix_asset_assignments_asset_id', table_name='asset_assignments')
    op.drop_table('asset_assignments')

    op.drop_index('ix_assets_workspace_id', table_name='assets')
    op.drop_table('assets')
