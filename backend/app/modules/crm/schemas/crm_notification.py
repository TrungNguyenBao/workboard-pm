import uuid
from datetime import datetime

from pydantic import BaseModel


class CrmNotificationResponse(BaseModel):
    id: uuid.UUID
    recipient_id: uuid.UUID
    type: str
    title: str
    body: str | None
    entity_type: str | None
    entity_id: uuid.UUID | None
    is_read: bool
    channel: str
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UnreadCountResponse(BaseModel):
    count: int
