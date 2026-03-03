import uuid
from datetime import date

from pydantic import BaseModel, Field, model_validator


class LeaveRequestCreate(BaseModel):
    employee_id: uuid.UUID
    leave_type_id: uuid.UUID
    start_date: date
    end_date: date
    days: int = Field(ge=1)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date must be >= start_date")
        return self


class LeaveRequestUpdate(BaseModel):
    start_date: date | None = None
    end_date: date | None = None
    days: int | None = Field(default=None, ge=1)


class LeaveRequestResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    leave_type_id: uuid.UUID
    start_date: date
    end_date: date
    days: int
    status: str
    reviewed_by_id: uuid.UUID | None
    workspace_id: uuid.UUID

    model_config = {"from_attributes": True}
