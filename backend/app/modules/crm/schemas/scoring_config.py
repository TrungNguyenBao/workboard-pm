import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ScoringRuleItem(BaseModel):
    activity_type: str = Field(min_length=1, max_length=100)
    points: int = Field(ge=0, le=100)


class ScoringThresholds(BaseModel):
    cold_max: int = Field(default=30, ge=0)
    warm_max: int = Field(default=60, ge=0)


class ScoringConfigUpdate(BaseModel):
    rules: list[ScoringRuleItem]
    thresholds: ScoringThresholds


class ScoringConfigResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    rules: dict
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
