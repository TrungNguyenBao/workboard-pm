import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class SalaryHistoryCreate(BaseModel):
    employee_id: uuid.UUID
    effective_date: date
    previous_amount: float = Field(ge=0)
    new_amount: float = Field(ge=0)
    reason: str = Field(min_length=1, max_length=255)
    approved_by_id: uuid.UUID | None = None


class SalaryHistoryResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    effective_date: date
    previous_amount: float
    new_amount: float
    reason: str
    approved_by_id: uuid.UUID | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
