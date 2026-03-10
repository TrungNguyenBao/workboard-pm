import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.modules.pms.schemas.project import SectionResponse
from app.modules.pms.schemas.task import TaskResponse


class SprintCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    goal: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None


class SprintUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    goal: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None


class SprintResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    goal: str | None
    start_date: datetime | None
    end_date: datetime | None
    status: str
    created_by_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    task_count: int = 0
    completed_points: int = 0
    total_points: int = 0

    model_config = ConfigDict(from_attributes=True)


class SprintBoardResponse(BaseModel):
    sprint: SprintResponse
    sections: list[SectionResponse]
    tasks: list[TaskResponse]

    model_config = ConfigDict(from_attributes=True)


class BurndownPoint(BaseModel):
    date: str  # ISO date string YYYY-MM-DD
    completed_points: int
    total_points: int


class VelocityPoint(BaseModel):
    sprint_id: uuid.UUID
    sprint_name: str
    completed_points: int


class SprintCompleteRequest(BaseModel):
    move_to_sprint_id: uuid.UUID | None = None


SprintStatusFilter = Literal["planning", "active", "completed"]
