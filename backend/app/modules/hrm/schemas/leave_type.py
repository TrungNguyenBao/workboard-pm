import uuid

from pydantic import BaseModel, Field


class LeaveTypeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    days_per_year: int = Field(default=0, ge=0)


class LeaveTypeUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    days_per_year: int | None = Field(default=None, ge=0)


class LeaveTypeResponse(BaseModel):
    id: uuid.UUID
    name: str
    days_per_year: int
    workspace_id: uuid.UUID

    model_config = {"from_attributes": True}
