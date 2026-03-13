import uuid
from datetime import datetime

from pydantic import BaseModel, Field

ACTIVITY_TYPES = ["call", "email", "meeting", "demo", "follow_up"]


class ActivityCreate(BaseModel):
    type: str = Field(max_length=50)
    subject: str = Field(min_length=1, max_length=255)
    notes: str | None = None
    date: datetime
    outcome: str | None = None
    next_action_date: datetime | None = None
    owner_id: uuid.UUID | None = None
    contact_id: uuid.UUID | None = None
    deal_id: uuid.UUID | None = None
    lead_id: uuid.UUID | None = None


class ActivityUpdate(BaseModel):
    type: str | None = Field(default=None, max_length=50)
    subject: str | None = Field(default=None, max_length=255)
    notes: str | None = None
    date: datetime | None = None
    outcome: str | None = None
    next_action_date: datetime | None = None
    owner_id: uuid.UUID | None = None
    contact_id: uuid.UUID | None = None
    deal_id: uuid.UUID | None = None
    lead_id: uuid.UUID | None = None


class ActivityResponse(BaseModel):
    id: uuid.UUID
    type: str
    subject: str
    notes: str | None
    date: datetime
    outcome: str | None
    next_action_date: datetime | None
    owner_id: uuid.UUID | None
    contact_id: uuid.UUID | None
    deal_id: uuid.UUID | None
    lead_id: uuid.UUID | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
