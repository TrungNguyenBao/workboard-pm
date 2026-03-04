import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

VALID_STATUSES = {"scheduled", "completed", "cancelled"}


class InterviewCreate(BaseModel):
    candidate_id: uuid.UUID
    interviewer_id: uuid.UUID | None = None
    scheduled_at: datetime
    duration_minutes: int = 60
    status: str = "scheduled"

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v


class InterviewUpdate(BaseModel):
    interviewer_id: uuid.UUID | None = None
    scheduled_at: datetime | None = None
    duration_minutes: int | None = None
    feedback: str | None = None
    score: int | None = Field(default=None, ge=1, le=5)
    status: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v


class InterviewResponse(BaseModel):
    id: uuid.UUID
    candidate_id: uuid.UUID
    interviewer_id: uuid.UUID | None
    scheduled_at: datetime
    duration_minutes: int
    feedback: str | None
    score: int | None
    status: str
    workspace_id: uuid.UUID

    model_config = {"from_attributes": True}
