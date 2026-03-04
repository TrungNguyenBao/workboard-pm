import uuid

from pydantic import BaseModel, Field


class PositionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    department_id: uuid.UUID
    headcount_limit: int = Field(default=0, ge=0)
    description: str | None = Field(default=None, max_length=500)
    is_active: bool = True


class PositionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    department_id: uuid.UUID | None = None
    headcount_limit: int | None = Field(default=None, ge=0)
    description: str | None = None
    is_active: bool | None = None


class PositionResponse(BaseModel):
    id: uuid.UUID
    title: str
    department_id: uuid.UUID
    headcount_limit: int
    description: str | None
    is_active: bool
    workspace_id: uuid.UUID
    created_at: str | None = None
    updated_at: str | None = None

    model_config = {"from_attributes": True}
