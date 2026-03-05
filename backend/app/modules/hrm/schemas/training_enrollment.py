import uuid
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, field_validator

VALID_STATUSES = {"enrolled", "in_progress", "completed", "dropped"}


class TrainingEnrollmentCreate(BaseModel):
    program_id: uuid.UUID
    employee_id: uuid.UUID


class TrainingEnrollmentUpdate(BaseModel):
    status: str | None = None
    completion_date: date | None = None
    score: Decimal | None = None
    feedback: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v


class TrainingEnrollmentResponse(BaseModel):
    id: uuid.UUID
    program_id: uuid.UUID
    employee_id: uuid.UUID
    status: str
    completion_date: date | None
    score: Decimal | None
    feedback: str | None
    workspace_id: uuid.UUID

    model_config = {"from_attributes": True}
