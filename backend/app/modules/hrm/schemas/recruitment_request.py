import uuid
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, field_validator, model_validator

VALID_STATUSES = {"draft", "submitted", "hr_approved", "ceo_approved", "open", "closed", "cancelled", "rejected"}


class RecruitmentRequestCreate(BaseModel):
    title: str
    department_id: uuid.UUID
    position_id: uuid.UUID | None = None
    quantity: int = 1
    reason: str
    requirements: str | None = None
    deadline: date | None = None
    status: str = "draft"
    requester_id: uuid.UUID
    salary_range_min: Decimal | None = None
    salary_range_max: Decimal | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v

    @model_validator(mode="after")
    def validate_salary_range(self) -> "RecruitmentRequestCreate":
        if self.salary_range_min is not None and self.salary_range_max is not None:
            if self.salary_range_min > self.salary_range_max:
                raise ValueError("salary_range_min must be <= salary_range_max")
        return self


class RecruitmentRequestUpdate(BaseModel):
    title: str | None = None
    department_id: uuid.UUID | None = None
    position_id: uuid.UUID | None = None
    quantity: int | None = None
    reason: str | None = None
    requirements: str | None = None
    deadline: date | None = None
    status: str | None = None
    salary_range_min: Decimal | None = None
    salary_range_max: Decimal | None = None

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
    salary_range_min: Decimal | None = None
    salary_range_max: Decimal | None = None

    model_config = {"from_attributes": True}
