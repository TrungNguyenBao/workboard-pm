import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


LeadSource = Literal["website", "ads", "form", "referral", "manual"]
LeadStatus = Literal["new", "contacted", "qualified", "opportunity", "lost", "disqualified"]
LEAD_SOURCES = ["website", "ads", "form", "referral", "manual"]
LEAD_STATUSES = ["new", "contacted", "qualified", "opportunity", "lost", "disqualified"]


class LeadCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    source: LeadSource = "manual"
    status: LeadStatus = "new"
    score: int = 0
    owner_id: uuid.UUID | None = None
    campaign_id: uuid.UUID | None = None


class LeadUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    email: str | None = None
    phone: str | None = None
    source: LeadSource | None = None
    status: LeadStatus | None = None
    score: int | None = None
    owner_id: uuid.UUID | None = None
    campaign_id: uuid.UUID | None = None
    contacted_at: datetime | None = None


class LeadConvertRequest(BaseModel):
    deal_title: str | None = None
    value: float | None = None
    expected_close_date: date | None = None
    create_contact: bool = True


class LeadResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str | None
    phone: str | None
    source: str
    status: str
    score: int
    disqualify_reason: str | None
    owner_id: uuid.UUID | None
    campaign_id: uuid.UUID | None
    contacted_at: datetime | None
    assigned_at: datetime | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LeadCreateResponse(BaseModel):
    """Create response that includes potential duplicates found during creation."""
    lead: LeadResponse
    duplicates: list[LeadResponse] | None = None

    model_config = {"from_attributes": True}


class LeadMergeRequest(BaseModel):
    keep_id: uuid.UUID
    merge_id: uuid.UUID
