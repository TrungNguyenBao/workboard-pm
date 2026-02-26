import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CommentCreate(BaseModel):
    body: str = Field(min_length=1)
    body_text: str | None = None


class CommentUpdate(BaseModel):
    body: str = Field(min_length=1)
    body_text: str | None = None


class CommentResponse(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    author_id: uuid.UUID
    body: str
    body_text: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
