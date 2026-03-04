import uuid
from datetime import date

from pydantic import BaseModel, field_validator

VALID_STATUSES = {"draft", "open", "closed", "cancelled"}


class RecruitmentRequestCreate(BaseModel):
    title: str
    department_id: uuid.UUID
    position_id: uuid.UUID | None = None
    quantity: int = 1
    reason: str
    requirements: str | None = None
    deadline: date | None = None
    status: str = "open"
    requester_id: uuid.UUID

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v


class RecruitmentRequestUpdate(BaseModel):
    title: str | None = None
    department_id: uuid.UUID | None = None
    position_id: uuid.UUID | None = None
    quantity: int | None = None
    reason: str | None = None
    requirements: str | None = None
    deadline: date | None = None
    status: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v


class RecruitmentRequestResponse(BaseModel):
    id: uuid.UUID
    title: str
    department_id: uuid.UUID
    position_id: uuid.UUID | None
    quantity: int
    reason: str
    requirements: str | None
    deadline: date | None
    status: str
    requester_id: uuid.UUID
    workspace_id: uuid.UUID

    model_config = {"from_attributes": True}
