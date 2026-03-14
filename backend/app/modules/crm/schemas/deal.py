import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

DEAL_STAGES = ["lead", "qualified", "needs_analysis", "proposal", "negotiation", "closed_won", "closed_lost"]
DealStage = Literal["lead", "qualified", "needs_analysis", "proposal", "negotiation", "closed_won", "closed_lost"]

STAGE_DEFAULT_PROBABILITY: dict[str, float] = {
    "lead": 5.0,
    "qualified": 10.0,
    "needs_analysis": 20.0,
    "proposal": 50.0,
    "negotiation": 75.0,
    "closed_won": 100.0,
    "closed_lost": 0.0,
}


class DealCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    value: float = 0.0
    stage: DealStage = "lead"
    probability: float = 0.0
    expected_close_date: date | None = None
    contact_id: uuid.UUID | None = None
    account_id: uuid.UUID | None = None
    lead_id: uuid.UUID | None = None
    owner_id: uuid.UUID | None = None


class DealUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    value: float | None = None
    stage: DealStage | None = None
    probability: float | None = None
    expected_close_date: date | None = None
    contact_id: uuid.UUID | None = None
    account_id: uuid.UUID | None = None
    lead_id: uuid.UUID | None = None
    owner_id: uuid.UUID | None = None
    loss_reason: str | None = None


class DealResponse(BaseModel):
    id: uuid.UUID
    title: str
    value: float
    stage: str
    probability: float
    probability_manual: bool = False
    expected_close_date: date | None
    last_activity_date: datetime | None
    loss_reason: str | None
    closed_at: datetime | None
    owner_id: uuid.UUID | None
    last_updated_by: uuid.UUID | None
    contact_id: uuid.UUID | None
    account_id: uuid.UUID | None
    lead_id: uuid.UUID | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    warning: str | None = None

    model_config = {"from_attributes": True}


class DealCloseRequest(BaseModel):
    action: Literal["won", "lost"]
    loss_reason: str | None = None
    competitor_id: uuid.UUID | None = None
