import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

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


class EmployeeUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    email: str | None = Field(default=None, max_length=255)
    department_id: uuid.UUID | None = None
    position: str | None = None
    hire_date: datetime | None = None
    user_id: uuid.UUID | None = None


class EmployeeResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    department_id: uuid.UUID | None
    position: str | None
    hire_date: datetime | None
    user_id: uuid.UUID | None
    workspace_id: uuid.UUID

    model_config = {"from_attributes": True}


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
