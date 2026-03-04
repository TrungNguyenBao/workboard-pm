import uuid

from pydantic import BaseModel, field_validator

VALID_STATUSES = {"applied", "screening", "interviewing", "offered", "hired", "rejected"}


class CandidateCreate(BaseModel):
    recruitment_request_id: uuid.UUID
    name: str
    email: str
    phone: str | None = None
    resume_url: str | None = None
    status: str = "applied"
    notes: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v


class CandidateUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    resume_url: str | None = None
    status: str | None = None
    notes: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v


class CandidateResponse(BaseModel):
    id: uuid.UUID
    recruitment_request_id: uuid.UUID
    name: str
    email: str
    phone: str | None
    resume_url: str | None
    status: str
    notes: str | None
    workspace_id: uuid.UUID

    model_config = {"from_attributes": True}
