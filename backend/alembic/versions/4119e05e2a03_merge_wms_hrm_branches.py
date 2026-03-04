"""merge_wms_hrm_branches

Revision ID: 4119e05e2a03
Revises: 0007, 203a42c349d6
Create Date: 2026-03-04 18:11:43.407977

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4119e05e2a03'
down_revision: Union[str, Sequence[str], None] = ('0007', '203a42c349d6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
