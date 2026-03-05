import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ExitInterviewCreate(BaseModel):
    resignation_id: uuid.UUID
    interviewer_id: uuid.UUID | None = None
    feedback: dict[str, Any] | None = None
    conducted_at: datetime | None = None


class ExitInterviewUpdate(BaseModel):
    interviewer_id: uuid.UUID | None = None
    feedback: dict[str, Any] | None = None
    conducted_at: datetime | None = None


class ExitInterviewResponse(BaseModel):
    id: uuid.UUID
    resignation_id: uuid.UUID
    interviewer_id: uuid.UUID | None
    feedback: dict[str, Any] | None
    conducted_at: datetime | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
