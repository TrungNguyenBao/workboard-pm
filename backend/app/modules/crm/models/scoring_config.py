import uuid

from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin


class ScoringConfig(Base, TimestampMixin):
    __tablename__ = "scoring_configs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id"), unique=True, index=True
    )
    rules: Mapped[dict] = mapped_column(JSONB, default=dict)
    # rules format:
    # {
    #   "activity_scores": {"email_open": 5, "click": 10, ...},
    #   "thresholds": {"cold_max": 30, "warm_max": 60}
    # }
