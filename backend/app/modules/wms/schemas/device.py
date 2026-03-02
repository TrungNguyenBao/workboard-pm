import uuid
from typing import Any

from pydantic import BaseModel, Field, model_validator


class DeviceCreate(BaseModel):
    serial_number: str = Field(min_length=1, max_length=255)
    product_id: uuid.UUID
    warehouse_id: uuid.UUID | None = None
    status: str = Field(default="in_stock", max_length=20)
    notes: str | None = Field(default=None, max_length=2000)


class DeviceUpdate(BaseModel):
    serial_number: str | None = Field(default=None, min_length=1, max_length=255)
    product_id: uuid.UUID | None = None
    warehouse_id: uuid.UUID | None = None
    status: str | None = Field(default=None, max_length=20)
    notes: str | None = None


class DeviceResponse(BaseModel):
    id: uuid.UUID
    serial_number: str
    product_id: uuid.UUID
    warehouse_id: uuid.UUID | None
    status: str
    notes: str | None
    workspace_id: uuid.UUID
    product_name: str | None = None
    warehouse_name: str | None = None

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def extract_relations(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return data
        d = data.__dict__
        product = d.get("product")
        warehouse = d.get("warehouse")
        return {
            "id": data.id,
            "serial_number": data.serial_number,
            "product_id": data.product_id,
            "warehouse_id": data.warehouse_id,
            "status": data.status,
            "notes": data.notes,
            "workspace_id": data.workspace_id,
            "product_name": product.name if product else None,
            "warehouse_name": warehouse.name if warehouse else None,
        }
