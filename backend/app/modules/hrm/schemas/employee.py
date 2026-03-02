import uuid
from datetime import datetime

from pydantic import BaseModel, Field


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
