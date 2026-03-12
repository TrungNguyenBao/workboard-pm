import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


CampaignType = Literal["email", "ads", "event", "social"]
CampaignStatus = Literal["draft", "active", "completed", "cancelled"]
CAMPAIGN_TYPES = ["email", "ads", "event", "social"]
CAMPAIGN_STATUSES = ["draft", "active", "completed", "cancelled"]


class CampaignCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: CampaignType
    budget: float = 0.0
    actual_cost: float = 0.0
    start_date: date | None = None
    end_date: date | None = None
    status: CampaignStatus = "draft"


class CampaignUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    type: CampaignType | None = None
    budget: float | None = None
    actual_cost: float | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: CampaignStatus | None = None


class CampaignResponse(BaseModel):
    id: uuid.UUID
    name: str
    type: str
    budget: float
    actual_cost: float
    start_date: date | None
    end_date: date | None
    status: str
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
