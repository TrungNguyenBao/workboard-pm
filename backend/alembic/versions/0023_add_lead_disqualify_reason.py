"""add lead disqualify_reason column

Revision ID: 0023
Revises: 0022
Create Date: 2026-03-12
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = '0023'
down_revision: Union[str, Sequence[str], None] = '0022'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('leads', sa.Column('disqualify_reason', sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column('leads', 'disqualify_reason')
