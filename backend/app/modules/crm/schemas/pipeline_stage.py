import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class PipelineStageCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    position: int = Field(default=0, ge=0)
    default_probability: float = Field(default=0.0, ge=0.0, le=1.0)


class PipelineStageUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    position: int | None = Field(default=None, ge=0)
    default_probability: float | None = Field(default=None, ge=0.0, le=1.0)


class PipelineStageResponse(BaseModel):
    id: uuid.UUID
    name: str
    position: int
    default_probability: float
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReorderRequest(BaseModel):
    stage_ids: list[uuid.UUID]
