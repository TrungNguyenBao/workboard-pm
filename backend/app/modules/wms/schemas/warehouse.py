import uuid

from pydantic import BaseModel, Field


class WarehouseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    location: str | None = Field(default=None, max_length=500)
    is_active: bool = True


class WarehouseUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    location: str | None = None
    is_active: bool | None = None


class WarehouseResponse(BaseModel):
    id: uuid.UUID
    name: str
    location: str | None
    workspace_id: uuid.UUID
    is_active: bool

    model_config = {"from_attributes": True}
