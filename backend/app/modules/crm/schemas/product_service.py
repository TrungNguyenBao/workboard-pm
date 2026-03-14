import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

ProductType = Literal["product", "service", "bundle"]


class ProductServiceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    code: str = Field(min_length=1, max_length=50)
    type: ProductType = "product"
    category: str | None = Field(default=None, max_length=100)
    unit_price: float = 0.0
    currency: str = Field(default="VND", max_length=3)
    description: str | None = None
    is_active: bool = True


class ProductServiceUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    code: str | None = Field(default=None, max_length=50)
    type: ProductType | None = None
    category: str | None = Field(default=None, max_length=100)
    unit_price: float | None = None
    currency: str | None = Field(default=None, max_length=3)
    description: str | None = None
    is_active: bool | None = None


class ProductServiceResponse(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    type: str
    category: str | None
    unit_price: float
    currency: str
    description: str | None
    is_active: bool
    workspace_id: uuid.UUID
    created_by: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
