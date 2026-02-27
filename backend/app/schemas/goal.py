import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class GoalCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    description: str | None = None
    status: str = "on_track"
    calculation_method: str = "manual"
    color: str = "#5E6AD2"
    owner_id: uuid.UUID
    due_date: datetime | None = None


class GoalUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    description: str | None = None
    status: str | None = None
    calculation_method: str | None = None
    color: str | None = None
    owner_id: uuid.UUID | None = None
    due_date: datetime | None = None
    progress_value: float | None = None


class GoalResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    owner_id: uuid.UUID
    title: str
    description: str | None
    status: str
    progress_value: float
    calculation_method: str
    color: str
    due_date: datetime | None
    created_at: datetime
    updated_at: datetime
    # Enriched fields
    owner_name: str | None = None
    linked_project_count: int = 0
    linked_task_count: int = 0

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_counts(cls, goal: Any) -> "GoalResponse":
        d = goal.__dict__
        owner = d.get("owner")
        project_links = d.get("project_links") or []
        task_links = d.get("task_links") or []
        return cls(
            id=goal.id,
            workspace_id=goal.workspace_id,
            owner_id=goal.owner_id,
            title=goal.title,
            description=goal.description,
            status=goal.status,
            progress_value=goal.progress_value,
            calculation_method=goal.calculation_method,
            color=goal.color,
            due_date=goal.due_date,
            created_at=goal.created_at,
            updated_at=goal.updated_at,
            owner_name=owner.name if owner else None,
            linked_project_count=len(project_links),
            linked_task_count=len(task_links),
        )


class LinkProjectRequest(BaseModel):
    project_id: uuid.UUID


class LinkTaskRequest(BaseModel):
    task_id: uuid.UUID
