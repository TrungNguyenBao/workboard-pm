"""wms device serial unique constraint per workspace

Revision ID: 0022
Revises: 0021
Create Date: 2026-03-09

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0022"
down_revision: Union[str, Sequence[str], None] = "0021"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add workspace-scoped unique constraint on wms_devices(workspace_id, serial_number)."""
    op.create_unique_constraint(
        "uq_wms_devices_workspace_serial",
        "wms_devices",
        ["workspace_id", "serial_number"],
    )


def downgrade() -> None:
    """Remove workspace-scoped unique constraint."""
    op.drop_constraint("uq_wms_devices_workspace_serial", "wms_devices", type_="unique")
