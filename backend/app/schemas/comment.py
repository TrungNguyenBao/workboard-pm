import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, model_validator


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
    author_name: str
    author_avatar_url: str | None
    body: str
    body_text: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def extract_author(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return data
        author = getattr(data, "author", None)
        return {
            "id": data.id,
            "task_id": data.task_id,
            "author_id": data.author_id,
            "author_name": author.name if author else "Unknown",
            "author_avatar_url": author.avatar_url if author else None,
            "body": data.body,
            "body_text": data.body_text,
            "created_at": data.created_at,
            "updated_at": data.updated_at,
        }
