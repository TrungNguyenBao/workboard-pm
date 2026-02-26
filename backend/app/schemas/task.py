import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, model_validator


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
    # Enriched fields (populated when relationships are eager-loaded)
    assignee_name: str | None = None
    assignee_avatar_url: str | None = None
    subtask_count: int = 0
    completed_subtask_count: int = 0

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def extract_from_orm(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return data
        # Read from already-loaded __dict__ to avoid triggering lazy loads
        d = data.__dict__
        assignee = d.get("assignee")
        subtasks = d.get("subtasks") or []
        return {
            "id": data.id,
            "project_id": data.project_id,
            "section_id": data.section_id,
            "assignee_id": data.assignee_id,
            "created_by_id": data.created_by_id,
            "parent_id": data.parent_id,
            "title": data.title,
            "description": data.description,
            "status": data.status,
            "priority": data.priority,
            "position": data.position,
            "due_date": data.due_date,
            "completed_at": data.completed_at,
            "created_at": data.created_at,
            "updated_at": data.updated_at,
            "assignee_name": assignee.name if assignee else None,
            "assignee_avatar_url": assignee.avatar_url if assignee else None,
            "subtask_count": len(subtasks),
            "completed_subtask_count": sum(
                1 for s in subtasks if s.status == "completed"
            ),
        }


class TaskDetailResponse(TaskResponse):
    tags: list[TagResponse] = []
    subtask_count: int = 0


class TaskMoveRequest(BaseModel):
    section_id: uuid.UUID | None = None
    position: float


class TagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    color: str = "#5E6AD2"
