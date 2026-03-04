import uuid
from datetime import date, datetime

from pydantic import BaseModel


class OnboardingChecklistCreate(BaseModel):
    employee_id: uuid.UUID
    task_name: str
    category: str | None = None
    assigned_to_id: uuid.UUID | None = None
    due_date: date | None = None
    is_completed: bool = False


class OnboardingChecklistUpdate(BaseModel):
    task_name: str | None = None
    category: str | None = None
    assigned_to_id: uuid.UUID | None = None
    due_date: date | None = None
    is_completed: bool | None = None


class OnboardingChecklistResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    task_name: str
    category: str | None
    assigned_to_id: uuid.UUID | None
    due_date: date | None
    is_completed: bool
    completed_at: datetime | None
    workspace_id: uuid.UUID

    model_config = {"from_attributes": True}
