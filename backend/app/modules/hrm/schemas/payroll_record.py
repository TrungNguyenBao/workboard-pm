import uuid

from pydantic import BaseModel, Field


class PayrollRecordCreate(BaseModel):
    employee_id: uuid.UUID
    period: str = Field(min_length=7, max_length=7, pattern=r"^\d{4}-\d{2}$")
    gross: float = Field(default=0, ge=0)
    net: float = Field(default=0, ge=0)
    deductions: dict | None = None


class PayrollRecordUpdate(BaseModel):
    gross: float | None = Field(default=None, ge=0)
    net: float | None = Field(default=None, ge=0)
    deductions: dict | None = None
    status: str | None = Field(default=None, pattern=r"^(draft|approved|paid)$")


class PayrollRecordResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    period: str
    gross: float
    net: float
    deductions: dict | None
    status: str
    workspace_id: uuid.UUID

    model_config = {"from_attributes": True}
