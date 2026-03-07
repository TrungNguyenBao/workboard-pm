import uuid
from datetime import datetime

from pydantic import BaseModel, Field


LEAD_SOURCES = ["website", "ads", "form", "referral", "manual"]
LEAD_STATUSES = ["new", "contacted", "qualified", "opportunity", "lost", "disqualified"]


class LeadCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    source: str = Field(default="manual", max_length=50)
    status: str = Field(default="new", max_length=50)
    score: int = 0
    owner_id: uuid.UUID | None = None
    campaign_id: uuid.UUID | None = None


class LeadUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    email: str | None = None
    phone: str | None = None
    source: str | None = Field(default=None, max_length=50)
    status: str | None = Field(default=None, max_length=50)
    score: int | None = None
    owner_id: uuid.UUID | None = None
    campaign_id: uuid.UUID | None = None
    contacted_at: datetime | None = None


class LeadResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str | None
    phone: str | None
    source: str
    status: str
    score: int
    owner_id: uuid.UUID | None
    campaign_id: uuid.UUID | None
    contacted_at: datetime | None
    assigned_at: datetime | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
