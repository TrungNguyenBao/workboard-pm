import uuid
from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, field_validator


InsuranceType = Literal["bhxh", "bhyt", "bhtn"]


class InsuranceRecordCreate(BaseModel):
    employee_id: uuid.UUID
    insurance_type: str
    base_salary: Decimal = Field(ge=0)
    employee_rate: Decimal = Field(ge=0, le=1)
    employer_rate: Decimal = Field(ge=0, le=1)
    effective_from: date
    effective_to: date | None = None

    @field_validator("insurance_type")
    @classmethod
    def validate_insurance_type(cls, v: str) -> str:
        allowed = {"bhxh", "bhyt", "bhtn"}
        if v not in allowed:
            raise ValueError(f"insurance_type must be one of {allowed}")
        return v


class InsuranceRecordUpdate(BaseModel):
    base_salary: Decimal | None = Field(default=None, ge=0)
    employee_rate: Decimal | None = Field(default=None, ge=0, le=1)
    employer_rate: Decimal | None = Field(default=None, ge=0, le=1)
    effective_to: date | None = None


class InsuranceRecordResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    insurance_type: str
    base_salary: Decimal
    employee_rate: Decimal
    employer_rate: Decimal
    effective_from: date
    effective_to: date | None
    workspace_id: uuid.UUID

    model_config = {"from_attributes": True}
