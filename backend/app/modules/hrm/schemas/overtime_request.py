import uuid
from datetime import date as date_type
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, field_validator

VALID_STATUSES = {"pending", "approved", "rejected"}


class OvertimeRequestCreate(BaseModel):
    employee_id: uuid.UUID
    date: date_type
    planned_hours: Decimal = Field(gt=0, le=24)
    reason: str = Field(min_length=1, max_length=500)


class OvertimeRequestUpdate(BaseModel):
    date: Optional[date_type] = None
    planned_hours: Optional[Decimal] = Field(default=None, gt=0, le=24)
    reason: Optional[str] = Field(default=None, min_length=1, max_length=500)
    status: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v


class OvertimeRequestResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    workspace_id: uuid.UUID
    date: date_type
    planned_hours: Decimal
    reason: str
    status: str
    approved_by_id: Optional[uuid.UUID] = None
    approved_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
