import uuid
from datetime import datetime

from pydantic import BaseModel, Field


TICKET_PRIORITIES = ["low", "medium", "high", "critical"]
TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"]


class TicketCreate(BaseModel):
    subject: str = Field(min_length=1, max_length=255)
    description: str | None = None
    priority: str = Field(default="medium", max_length=50)
    status: str = Field(default="open", max_length=50)
    contact_id: uuid.UUID | None = None
    account_id: uuid.UUID | None = None
    assigned_to: uuid.UUID | None = None


class TicketUpdate(BaseModel):
    subject: str | None = Field(default=None, max_length=255)
    description: str | None = None
    priority: str | None = Field(default=None, max_length=50)
    status: str | None = Field(default=None, max_length=50)
    contact_id: uuid.UUID | None = None
    account_id: uuid.UUID | None = None
    assigned_to: uuid.UUID | None = None


class TicketResponse(BaseModel):
    id: uuid.UUID
    subject: str
    description: str | None
    priority: str
    status: str
    contact_id: uuid.UUID | None
    account_id: uuid.UUID | None
    assigned_to: uuid.UUID | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
