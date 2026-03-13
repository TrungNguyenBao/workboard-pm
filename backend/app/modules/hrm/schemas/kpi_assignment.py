import re
import uuid
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

PERIOD_RE = re.compile(r"^\d{4}(-\d{2}|-Q[1-4]|-HY[12])?$")


class KpiAssignmentCreate(BaseModel):
    template_id: uuid.UUID
    employee_id: uuid.UUID
    period: str
    target_value: Decimal = Field(ge=0)
    weight: int = Field(default=1, ge=1)
    notes: str | None = None

    @field_validator("period")
    @classmethod
    def validate_period(cls, v: str) -> str:
        if not PERIOD_RE.match(v):
            raise ValueError("period must be YYYY, YYYY-MM, YYYY-Q1..Q4, or YYYY-HY1/HY2")
        return v


class KpiAssignmentUpdate(BaseModel):
    target_value: Decimal | None = Field(default=None, ge=0)
    actual_value: Decimal | None = Field(default=None, ge=0)
    weight: int | None = Field(default=None, ge=1)
    status: str | None = None
    notes: str | None = None


class KpiAssignmentResponse(BaseModel):
    id: uuid.UUID
    template_id: uuid.UUID
    employee_id: uuid.UUID
    period: str
    target_value: Decimal
    actual_value: Decimal | None
    weight: int
    status: str
    notes: str | None
    workspace_id: uuid.UUID

    model_config = {"from_attributes": True}
