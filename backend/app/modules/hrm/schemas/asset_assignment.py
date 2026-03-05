import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

_CONDITIONS = {"excellent", "good", "fair", "poor"}


class AssetAssignmentCreate(BaseModel):
    asset_id: uuid.UUID
    employee_id: uuid.UUID
    assigned_date: date
    condition_on_assign: str = "good"
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("condition_on_assign")
    @classmethod
    def validate_condition(cls, v: str) -> str:
        if v not in _CONDITIONS:
            raise ValueError(f"condition must be one of {_CONDITIONS}")
        return v


class AssetAssignmentUpdate(BaseModel):
    returned_date: date | None = None
    condition_on_return: str | None = None
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("condition_on_return")
    @classmethod
    def validate_condition_return(cls, v: str | None) -> str | None:
        if v is not None and v not in _CONDITIONS:
            raise ValueError(f"condition must be one of {_CONDITIONS}")
        return v


class AssetAssignmentResponse(BaseModel):
    id: uuid.UUID
    asset_id: uuid.UUID
    employee_id: uuid.UUID
    assigned_date: date
    returned_date: date | None
    condition_on_assign: str
    condition_on_return: str | None
    notes: str | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
