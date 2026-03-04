"""add_positions_alter_departments

Revision ID: 0008
Revises: 4119e05e2a03
Create Date: 2026-03-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0008'
down_revision: Union[str, Sequence[str], None] = '4119e05e2a03'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create positions table; add hierarchy/manager columns to departments."""
    # Add parent_department_id to departments (self-referential FK)
    op.add_column('departments', sa.Column('parent_department_id', sa.Uuid(), nullable=True))
    op.create_index('ix_departments_parent_department_id', 'departments', ['parent_department_id'])
    op.create_foreign_key(
        'fk_departments_parent_department_id',
        'departments', 'departments',
        ['parent_department_id'], ['id'],
    )

    # Add manager_id to departments (FK to employees)
    op.add_column('departments', sa.Column('manager_id', sa.Uuid(), nullable=True))
    op.create_foreign_key(
        'fk_departments_manager_id',
        'departments', 'employees',
        ['manager_id'], ['id'],
    )

    # Create positions table
    op.create_table(
        'positions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('department_id', sa.Uuid(), nullable=False),
        sa.Column('headcount_limit', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id']),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_positions_department_id', 'positions', ['department_id'])
    op.create_index('ix_positions_workspace_id', 'positions', ['workspace_id'])


def downgrade() -> None:
    """Reverse positions table and departments column additions."""
    op.drop_index('ix_positions_workspace_id', table_name='positions')
    op.drop_index('ix_positions_department_id', table_name='positions')
    op.drop_table('positions')

    op.drop_constraint('fk_departments_manager_id', 'departments', type_='foreignkey')
    op.drop_column('departments', 'manager_id')

    op.drop_constraint('fk_departments_parent_department_id', 'departments', type_='foreignkey')
    op.drop_index('ix_departments_parent_department_id', table_name='departments')
    op.drop_column('departments', 'parent_department_id')
