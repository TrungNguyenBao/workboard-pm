import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

_ASSET_STATUSES = {"available", "assigned", "maintenance", "retired"}


class AssetCreate(BaseModel):
    name: str = Field(max_length=255)
    category: str | None = Field(default=None, max_length=100)
    serial_number: str | None = Field(default=None, max_length=100)
    purchase_date: date | None = None
    purchase_value: Decimal | None = Field(default=None, ge=0)
    current_value: Decimal | None = Field(default=None, ge=0)
    status: str = "available"
    location: str | None = Field(default=None, max_length=255)
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in _ASSET_STATUSES:
            raise ValueError(f"status must be one of {_ASSET_STATUSES}")
        return v


class AssetUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    category: str | None = Field(default=None, max_length=100)
    serial_number: str | None = Field(default=None, max_length=100)
    purchase_date: date | None = None
    purchase_value: Decimal | None = Field(default=None, ge=0)
    current_value: Decimal | None = Field(default=None, ge=0)
    status: str | None = None
    location: str | None = Field(default=None, max_length=255)
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in _ASSET_STATUSES:
            raise ValueError(f"status must be one of {_ASSET_STATUSES}")
        return v


class AssetResponse(BaseModel):
    id: uuid.UUID
    name: str
    category: str | None
    serial_number: str | None
    purchase_date: date | None
    purchase_value: Decimal | None
    current_value: Decimal | None
    status: str
    location: str | None
    notes: str | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
