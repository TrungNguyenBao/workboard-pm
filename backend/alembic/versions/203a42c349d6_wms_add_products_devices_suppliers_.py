"""wms_add_products_devices_suppliers_enhance_warehouse_inventory

Revision ID: 203a42c349d6
Revises: 4988635d81cc
Create Date: 2026-03-02 18:56:49.206776

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '203a42c349d6'
down_revision: Union[str, Sequence[str], None] = '4988635d81cc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # New tables
    op.create_table('wms_products',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('sku', sa.String(length=100), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('description', sa.String(length=2000), nullable=True),
        sa.Column('unit', sa.String(length=50), nullable=False),
        sa.Column('is_serial_tracked', sa.Boolean(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_wms_products_sku'), 'wms_products', ['sku'], unique=False)
    op.create_index(op.f('ix_wms_products_workspace_id'), 'wms_products', ['workspace_id'], unique=False)

    op.create_table('wms_suppliers',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('contact_email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('address', sa.String(length=1000), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_wms_suppliers_workspace_id'), 'wms_suppliers', ['workspace_id'], unique=False)

    op.create_table('wms_devices',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('serial_number', sa.String(length=255), nullable=False),
        sa.Column('product_id', sa.Uuid(), nullable=False),
        sa.Column('warehouse_id', sa.Uuid(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('notes', sa.String(length=2000), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['wms_products.id']),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id']),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_wms_devices_product_id'), 'wms_devices', ['product_id'], unique=False)
    op.create_index(op.f('ix_wms_devices_serial_number'), 'wms_devices', ['serial_number'], unique=False)
    op.create_index(op.f('ix_wms_devices_status'), 'wms_devices', ['status'], unique=False)
    op.create_index(op.f('ix_wms_devices_warehouse_id'), 'wms_devices', ['warehouse_id'], unique=False)
    op.create_index(op.f('ix_wms_devices_workspace_id'), 'wms_devices', ['workspace_id'], unique=False)

    # Enhance existing tables
    op.add_column('inventory_items', sa.Column('product_id', sa.Uuid(), nullable=True))
    op.add_column('inventory_items', sa.Column('min_threshold', sa.Integer(), server_default='0', nullable=False))
    op.create_index(op.f('ix_inventory_items_product_id'), 'inventory_items', ['product_id'], unique=False)
    op.create_foreign_key('fk_inventory_items_product_id', 'inventory_items', 'wms_products', ['product_id'], ['id'])

    op.add_column('warehouses', sa.Column('address', sa.String(length=1000), nullable=True))
    op.add_column('warehouses', sa.Column('manager_name', sa.String(length=255), nullable=True))
    op.add_column('warehouses', sa.Column('description', sa.String(length=2000), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('warehouses', 'description')
    op.drop_column('warehouses', 'manager_name')
    op.drop_column('warehouses', 'address')

    op.drop_constraint('fk_inventory_items_product_id', 'inventory_items', type_='foreignkey')
    op.drop_index(op.f('ix_inventory_items_product_id'), table_name='inventory_items')
    op.drop_column('inventory_items', 'min_threshold')
    op.drop_column('inventory_items', 'product_id')

    op.drop_index(op.f('ix_wms_devices_workspace_id'), table_name='wms_devices')
    op.drop_index(op.f('ix_wms_devices_warehouse_id'), table_name='wms_devices')
    op.drop_index(op.f('ix_wms_devices_status'), table_name='wms_devices')
    op.drop_index(op.f('ix_wms_devices_serial_number'), table_name='wms_devices')
    op.drop_index(op.f('ix_wms_devices_product_id'), table_name='wms_devices')
    op.drop_table('wms_devices')

    op.drop_index(op.f('ix_wms_suppliers_workspace_id'), table_name='wms_suppliers')
    op.drop_table('wms_suppliers')

    op.drop_index(op.f('ix_wms_products_workspace_id'), table_name='wms_products')
    op.drop_index(op.f('ix_wms_products_sku'), table_name='wms_products')
    op.drop_table('wms_products')
