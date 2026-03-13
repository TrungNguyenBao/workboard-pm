import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

TicketPriority = Literal["low", "medium", "high", "critical"]
TicketStatus = Literal["open", "in_progress", "resolved", "closed"]
TICKET_PRIORITIES = ["low", "medium", "high", "critical"]
TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"]


class TicketCreate(BaseModel):
    subject: str = Field(min_length=1, max_length=255)
    description: str | None = None
    priority: TicketPriority = "medium"
    status: TicketStatus = "open"
    contact_id: uuid.UUID | None = None
    account_id: uuid.UUID | None = None
    assigned_to: uuid.UUID | None = None


class TicketUpdate(BaseModel):
    subject: str | None = Field(default=None, max_length=255)
    description: str | None = None
    priority: TicketPriority | None = None
    status: TicketStatus | None = None
    contact_id: uuid.UUID | None = None
    account_id: uuid.UUID | None = None
    assigned_to: uuid.UUID | None = None
    resolution_notes: str | None = None


class TicketResponse(BaseModel):
    id: uuid.UUID
    subject: str
    description: str | None
    priority: str
    status: str
    resolved_at: datetime | None
    closed_at: datetime | None
    resolution_notes: str | None
    contact_id: uuid.UUID | None
    account_id: uuid.UUID | None
    assigned_to: uuid.UUID | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
