"""add_wms_hrm_crm_tables

Revision ID: 4988635d81cc
Revises: 0006
Create Date: 2026-03-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4988635d81cc'
down_revision: Union[str, Sequence[str], None] = '0006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add WMS, HRM, CRM module tables."""
    # WMS: warehouses
    op.create_table('warehouses',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('location', sa.String(length=500), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_warehouses_workspace_id'), 'warehouses', ['workspace_id'])

    # WMS: inventory_items
    op.create_table('inventory_items',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('sku', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit', sa.String(length=50), nullable=False),
        sa.Column('warehouse_id', sa.Uuid(), nullable=False),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id']),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_inventory_items_sku'), 'inventory_items', ['sku'])
    op.create_index(op.f('ix_inventory_items_warehouse_id'), 'inventory_items', ['warehouse_id'])
    op.create_index(op.f('ix_inventory_items_workspace_id'), 'inventory_items', ['workspace_id'])

    # HRM: departments
    op.create_table('departments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_departments_workspace_id'), 'departments', ['workspace_id'])

    # HRM: employees
    op.create_table('employees',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('department_id', sa.Uuid(), nullable=True),
        sa.Column('position', sa.String(length=255), nullable=True),
        sa.Column('hire_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_employees_department_id'), 'employees', ['department_id'])
    op.create_index(op.f('ix_employees_user_id'), 'employees', ['user_id'])
    op.create_index(op.f('ix_employees_workspace_id'), 'employees', ['workspace_id'])

    # CRM: contacts
    op.create_table('contacts',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('company', sa.String(length=255), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_contacts_workspace_id'), 'contacts', ['workspace_id'])

    # CRM: deals
    op.create_table('deals',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('stage', sa.String(length=50), nullable=False),
        sa.Column('contact_id', sa.Uuid(), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id']),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_deals_contact_id'), 'deals', ['contact_id'])
    op.create_index(op.f('ix_deals_workspace_id'), 'deals', ['workspace_id'])


def downgrade() -> None:
    """Remove WMS, HRM, CRM module tables."""
    op.drop_index(op.f('ix_deals_workspace_id'), table_name='deals')
    op.drop_index(op.f('ix_deals_contact_id'), table_name='deals')
    op.drop_table('deals')
    op.drop_index(op.f('ix_contacts_workspace_id'), table_name='contacts')
    op.drop_table('contacts')
    op.drop_index(op.f('ix_employees_workspace_id'), table_name='employees')
    op.drop_index(op.f('ix_employees_user_id'), table_name='employees')
    op.drop_index(op.f('ix_employees_department_id'), table_name='employees')
    op.drop_table('employees')
    op.drop_index(op.f('ix_departments_workspace_id'), table_name='departments')
    op.drop_table('departments')
    op.drop_index(op.f('ix_inventory_items_workspace_id'), table_name='inventory_items')
    op.drop_index(op.f('ix_inventory_items_warehouse_id'), table_name='inventory_items')
    op.drop_index(op.f('ix_inventory_items_sku'), table_name='inventory_items')
    op.drop_table('inventory_items')
    op.drop_index(op.f('ix_warehouses_workspace_id'), table_name='warehouses')
    op.drop_table('warehouses')
