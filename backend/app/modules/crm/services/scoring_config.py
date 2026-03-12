import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.scoring_config import ScoringConfig
from app.modules.crm.schemas.scoring_config import ScoringConfigUpdate

DEFAULT_ACTIVITY_SCORES: dict[str, int] = {
    "email_open": 5,
    "click": 10,
    "form_submit": 15,
    "call": 15,
    "demo": 20,
    "follow_up": 5,
    "meeting": 20,
    "note": 2,
}

DEFAULT_THRESHOLDS = {"cold_max": 30, "warm_max": 60}


def _default_rules() -> dict:
    return {
        "activity_scores": DEFAULT_ACTIVITY_SCORES.copy(),
        "thresholds": DEFAULT_THRESHOLDS.copy(),
    }


async def get_scoring_config(
    db: AsyncSession, workspace_id: uuid.UUID
) -> ScoringConfig:
    result = await db.scalars(
        select(ScoringConfig).where(ScoringConfig.workspace_id == workspace_id)
    )
    config = result.first()
    if not config:
        config = ScoringConfig(workspace_id=workspace_id, rules=_default_rules())
        db.add(config)
        await db.commit()
        await db.refresh(config)
    return config


async def update_scoring_config(
    db: AsyncSession, workspace_id: uuid.UUID, data: ScoringConfigUpdate
) -> ScoringConfig:
    config = await get_scoring_config(db, workspace_id)
    config.rules = {
        "activity_scores": {r.activity_type: r.points for r in data.rules},
        "thresholds": data.thresholds.model_dump(),
    }
    await db.commit()
    await db.refresh(config)
    return config


async def get_activity_scores(
    db: AsyncSession, workspace_id: uuid.UUID
) -> dict[str, int]:
    config = await get_scoring_config(db, workspace_id)
    return config.rules.get("activity_scores", DEFAULT_ACTIVITY_SCORES.copy())


async def get_score_thresholds(
    db: AsyncSession, workspace_id: uuid.UUID
) -> dict[str, int]:
    config = await get_scoring_config(db, workspace_id)
    return config.rules.get("thresholds", DEFAULT_THRESHOLDS.copy())
