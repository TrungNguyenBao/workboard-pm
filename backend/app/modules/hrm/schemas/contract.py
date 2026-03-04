import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

_CONTRACT_TYPES = {"probation", "fixed_term", "indefinite"}
_CONTRACT_STATUSES = {"active", "expired", "terminated"}


class ContractCreate(BaseModel):
    employee_id: uuid.UUID
    contract_type: str
    start_date: date
    end_date: date | None = None
    base_salary: float = Field(ge=0)
    allowances: dict | None = None
    file_url: str | None = Field(default=None, max_length=500)
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("contract_type")
    @classmethod
    def validate_contract_type(cls, v: str) -> str:
        if v not in _CONTRACT_TYPES:
            raise ValueError(f"contract_type must be one of {_CONTRACT_TYPES}")
        return v


class ContractUpdate(BaseModel):
    contract_type: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    base_salary: float | None = Field(default=None, ge=0)
    allowances: dict | None = None
    status: str | None = None
    file_url: str | None = Field(default=None, max_length=500)
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("contract_type")
    @classmethod
    def validate_contract_type(cls, v: str | None) -> str | None:
        if v is not None and v not in _CONTRACT_TYPES:
            raise ValueError(f"contract_type must be one of {_CONTRACT_TYPES}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in _CONTRACT_STATUSES:
            raise ValueError(f"status must be one of {_CONTRACT_STATUSES}")
        return v


class ContractResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    contract_type: str
    start_date: date
    end_date: date | None
    base_salary: float
    allowances: dict | None
    status: str
    file_url: str | None
    notes: str | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
