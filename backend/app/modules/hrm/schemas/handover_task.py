import uuid
from datetime import date, datetime

from pydantic import BaseModel


class HandoverTaskCreate(BaseModel):
    resignation_id: uuid.UUID
    task_name: str
    from_employee_id: uuid.UUID | None = None
    to_employee_id: uuid.UUID | None = None
    due_date: date | None = None
    notes: str | None = None


class HandoverTaskUpdate(BaseModel):
    status: str | None = None
    to_employee_id: uuid.UUID | None = None
    notes: str | None = None
    due_date: date | None = None


class HandoverTaskResponse(BaseModel):
    id: uuid.UUID
    resignation_id: uuid.UUID
    task_name: str
    from_employee_id: uuid.UUID | None
    to_employee_id: uuid.UUID | None
    status: str
    due_date: date | None
    notes: str | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
