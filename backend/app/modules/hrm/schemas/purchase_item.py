import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class PurchaseItemCreate(BaseModel):
    request_id: uuid.UUID
    item_name: str = Field(max_length=255)
    quantity: int = Field(default=1, ge=1)
    unit_price: Decimal = Field(default=Decimal("0"), ge=0)


class PurchaseItemUpdate(BaseModel):
    item_name: str | None = Field(default=None, max_length=255)
    quantity: int | None = Field(default=None, ge=1)
    unit_price: Decimal | None = Field(default=None, ge=0)


class PurchaseItemResponse(BaseModel):
    id: uuid.UUID
    request_id: uuid.UUID
    item_name: str
    quantity: int
    unit_price: Decimal
    total: Decimal
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
