import uuid

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    sku: str = Field(min_length=1, max_length=100)
    category: str = Field(default="equipment", max_length=50)
    description: str | None = Field(default=None, max_length=2000)
    unit: str = Field(default="pcs", max_length=50)
    is_serial_tracked: bool = False
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    sku: str | None = Field(default=None, min_length=1, max_length=100)
    category: str | None = Field(default=None, max_length=50)
    description: str | None = None
    unit: str | None = Field(default=None, max_length=50)
    is_serial_tracked: bool | None = None
    is_active: bool | None = None


class ProductResponse(BaseModel):
    id: uuid.UUID
    name: str
    sku: str
    category: str
    description: str | None
    unit: str
    is_serial_tracked: bool
    is_active: bool
    workspace_id: uuid.UUID

    model_config = {"from_attributes": True}
