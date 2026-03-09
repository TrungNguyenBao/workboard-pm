import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, Field, field_validator

VALID_EMPLOYEE_STATUSES = {"active", "inactive", "probation"}

if TYPE_CHECKING:
    from app.modules.hrm.schemas.contract import ContractResponse
    from app.modules.hrm.schemas.salary_history import SalaryHistoryResponse


class EmployeeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: str = Field(max_length=255)
    department_id: uuid.UUID | None = None
    position: str | None = Field(default=None, max_length=255)
    hire_date: datetime | None = None
    user_id: uuid.UUID | None = None
    date_of_birth: date | None = None
    address: str | None = None
    national_id: str | None = Field(default=None, max_length=50)
    bank_account_number: str | None = Field(default=None, max_length=50)
    bank_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    employee_status: str = "active"

    @field_validator("employee_status")
    @classmethod
    def validate_employee_status(cls, v: str) -> str:
        if v not in VALID_EMPLOYEE_STATUSES:
            raise ValueError(f"employee_status must be one of {VALID_EMPLOYEE_STATUSES}")
        return v


class EmployeeUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    email: str | None = Field(default=None, max_length=255)
    department_id: uuid.UUID | None = None
    position: str | None = None
    hire_date: datetime | None = None
    user_id: uuid.UUID | None = None
    date_of_birth: date | None = None
    address: str | None = None
    national_id: str | None = Field(default=None, max_length=50)
    bank_account_number: str | None = Field(default=None, max_length=50)
    bank_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    employee_status: str | None = None

    @field_validator("employee_status")
    @classmethod
    def validate_employee_status(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_EMPLOYEE_STATUSES:
            raise ValueError(f"employee_status must be one of {VALID_EMPLOYEE_STATUSES}")
        return v


class EmployeeListResponse(BaseModel):
    """List response — excludes PII (national_id, bank details)."""
    id: uuid.UUID
    name: str
    email: str
    department_id: uuid.UUID | None
    position: str | None
    hire_date: datetime | None
    user_id: uuid.UUID | None
    workspace_id: uuid.UUID
    phone: str | None = None
    employee_status: str = "active"

    model_config = {"from_attributes": True}


class EmployeeResponse(EmployeeListResponse):
    """Full response — includes PII. Only for detail/HR endpoints."""
    date_of_birth: date | None = None
    address: str | None = None
    national_id: str | None = None
    bank_account_number: str | None = None
    bank_name: str | None = None


class EmployeeDetailResponse(EmployeeResponse):
    active_contract: "ContractResponse | None" = None
    recent_salary_changes: "list[SalaryHistoryResponse]" = []
    leave_balance: dict = {}  # {leave_type_name: {total, used, remaining}}


# Resolve forward references at module load time
def _update_forward_refs() -> None:
    from app.modules.hrm.schemas.contract import ContractResponse  # noqa: F401
    from app.modules.hrm.schemas.salary_history import SalaryHistoryResponse  # noqa: F401
    EmployeeDetailResponse.model_rebuild()


_update_forward_refs()
