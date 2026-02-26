import uuid

from pydantic import BaseModel, Field


class TeamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    color: str | None = None


class TeamUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    color: str | None = None


class TeamResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    description: str | None
    color: str | None

    model_config = {"from_attributes": True}
