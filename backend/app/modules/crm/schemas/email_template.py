import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

EmailCategory = Literal["welcome", "follow_up", "proposal", "meeting", "general"]


class EmailTemplateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    subject: str = Field(min_length=1, max_length=500)
    body_html: str
    category: EmailCategory = "general"
    merge_tags: dict | None = None
    is_active: bool = True


class EmailTemplateUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    subject: str | None = Field(default=None, max_length=500)
    body_html: str | None = None
    category: EmailCategory | None = None
    merge_tags: dict | None = None
    is_active: bool | None = None


class EmailTemplateResponse(BaseModel):
    id: uuid.UUID
    name: str
    subject: str
    body_html: str
    category: str
    merge_tags: Any | None
    is_active: bool
    created_by: uuid.UUID | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
