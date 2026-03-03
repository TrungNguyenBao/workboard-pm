import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class DealCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    value: float = 0.0
    stage: str = Field(default="lead", max_length=50)
    contact_id: uuid.UUID | None = None


class DealUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    value: float | None = None
    stage: str | None = Field(default=None, max_length=50)
    contact_id: uuid.UUID | None = None


class DealResponse(BaseModel):
    id: uuid.UUID
    title: str
    value: float
    stage: str
    contact_id: uuid.UUID | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
