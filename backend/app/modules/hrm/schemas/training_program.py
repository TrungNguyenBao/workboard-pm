import uuid
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, field_validator

VALID_STATUSES = {"planned", "active", "completed", "cancelled"}


class TrainingProgramCreate(BaseModel):
    name: str
    description: str | None = None
    budget: Decimal | None = None
    start_date: date | None = None
    end_date: date | None = None
    trainer: str | None = None
    status: str = "planned"

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v


class TrainingProgramUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    budget: Decimal | None = None
    start_date: date | None = None
    end_date: date | None = None
    trainer: str | None = None
    status: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v


class TrainingProgramResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    budget: Decimal | None
    start_date: date | None
    end_date: date | None
    trainer: str | None
    status: str
    workspace_id: uuid.UUID

    model_config = {"from_attributes": True}
