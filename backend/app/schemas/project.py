import uuid

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    color: str = "#5E6AD2"
    icon: str | None = None
    visibility: str = "team"
    team_id: uuid.UUID | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    color: str | None = None
    icon: str | None = None
    visibility: str | None = None
    is_archived: bool | None = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    team_id: uuid.UUID | None
    owner_id: uuid.UUID
    name: str
    description: str | None
    color: str
    icon: str | None
    visibility: str
    is_archived: bool

    model_config = {"from_attributes": True}


class SectionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    color: str | None = None
    position: float | None = None


class SectionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    color: str | None = None
    position: float | None = None


class SectionResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    color: str | None
    position: float

    model_config = {"from_attributes": True}
