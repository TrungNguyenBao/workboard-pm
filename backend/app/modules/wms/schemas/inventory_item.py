import uuid
from typing import Any

from pydantic import BaseModel, Field, model_validator


class InventoryItemCreate(BaseModel):
    sku: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=255)
    quantity: int = 0
    unit: str = Field(default="pcs", max_length=50)
    warehouse_id: uuid.UUID
    product_id: uuid.UUID | None = None
    min_threshold: int = 0


class InventoryItemUpdate(BaseModel):
    sku: str | None = Field(default=None, max_length=100)
    name: str | None = Field(default=None, max_length=255)
    quantity: int | None = None
    unit: str | None = Field(default=None, max_length=50)
    warehouse_id: uuid.UUID | None = None
    product_id: uuid.UUID | None = None
    min_threshold: int | None = None


class InventoryItemResponse(BaseModel):
    id: uuid.UUID
    sku: str
    name: str
    quantity: int
    unit: str
    warehouse_id: uuid.UUID
    product_id: uuid.UUID | None
    min_threshold: int
    workspace_id: uuid.UUID
    product_name: str | None = None

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def extract_relations(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return data
        d = data.__dict__
        product = d.get("product")
        return {
            "id": data.id,
            "sku": data.sku,
            "name": data.name,
            "quantity": data.quantity,
            "unit": data.unit,
            "warehouse_id": data.warehouse_id,
            "product_id": data.product_id,
            "min_threshold": data.min_threshold,
            "workspace_id": data.workspace_id,
            "product_name": product.name if product else None,
        }
