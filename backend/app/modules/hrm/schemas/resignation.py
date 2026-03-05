import uuid
from datetime import date, datetime

from pydantic import BaseModel


class ResignationCreate(BaseModel):
    employee_id: uuid.UUID
    resignation_date: date
    last_working_day: date
    reason: str | None = None


class ResignationUpdate(BaseModel):
    last_working_day: date | None = None
    reason: str | None = None
    status: str | None = None


class ResignationResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    resignation_date: date
    last_working_day: date
    reason: str | None
    status: str
    approved_by_id: uuid.UUID | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
