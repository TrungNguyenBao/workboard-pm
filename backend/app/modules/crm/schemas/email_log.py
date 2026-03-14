import uuid
from datetime import datetime

from pydantic import BaseModel


class SendEmailRequest(BaseModel):
    template_id: uuid.UUID
    contact_id: uuid.UUID
    deal_id: uuid.UUID | None = None
    lead_id: uuid.UUID | None = None
    merge_values: dict | None = None


class EmailLogResponse(BaseModel):
    id: uuid.UUID
    contact_id: uuid.UUID | None
    deal_id: uuid.UUID | None
    lead_id: uuid.UUID | None
    template_id: uuid.UUID | None
    subject: str
    body: str
    direction: str
    status: str
    sent_at: datetime
    opened_at: datetime | None
    clicked_at: datetime | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedEmailLogs(BaseModel):
    items: list[EmailLogResponse]
    total: int
    page: int
    page_size: int
