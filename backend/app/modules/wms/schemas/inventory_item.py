import uuid

from pydantic import BaseModel, Field


class InventoryItemCreate(BaseModel):
    sku: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=255)
    quantity: int = 0
    unit: str = Field(default="pcs", max_length=50)
    warehouse_id: uuid.UUID


class InventoryItemUpdate(BaseModel):
    sku: str | None = Field(default=None, max_length=100)
    name: str | None = Field(default=None, max_length=255)
    quantity: int | None = None
    unit: str | None = Field(default=None, max_length=50)
    warehouse_id: uuid.UUID | None = None


class InventoryItemResponse(BaseModel):
    id: uuid.UUID
    sku: str
    name: str
    quantity: int
    unit: str
    warehouse_id: uuid.UUID
    workspace_id: uuid.UUID

    model_config = {"from_attributes": True}
