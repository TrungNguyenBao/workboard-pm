import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: str | None = None
    section_id: uuid.UUID | None = None
    assignee_id: uuid.UUID | None = None
    parent_id: uuid.UUID | None = None
    priority: str = "none"
    due_date: datetime | None = None
    position: float | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = None
    section_id: uuid.UUID | None = None
    assignee_id: uuid.UUID | None = None
    priority: str | None = None
    status: str | None = None
    due_date: datetime | None = None
    position: float | None = None


class TagResponse(BaseModel):
    id: uuid.UUID
    name: str
    color: str
    model_config = {"from_attributes": True}


class TaskResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    section_id: uuid.UUID | None
    assignee_id: uuid.UUID | None
    created_by_id: uuid.UUID
    parent_id: uuid.UUID | None
    title: str
    description: str | None
    status: str
    priority: str
    position: float
    due_date: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskDetailResponse(TaskResponse):
    tags: list[TagResponse] = []
    subtask_count: int = 0


class TaskMoveRequest(BaseModel):
    section_id: uuid.UUID | None = None
    position: float


class TagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    color: str = "#5E6AD2"
