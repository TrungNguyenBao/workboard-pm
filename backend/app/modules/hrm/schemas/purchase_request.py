import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.modules.hrm.schemas.purchase_item import PurchaseItemResponse

_PR_STATUSES = {"draft", "submitted", "approved", "rejected", "ordered", "completed"}


class PurchaseRequestCreate(BaseModel):
    title: str = Field(max_length=255)
    description: str | None = None
    estimated_total: Decimal = Field(default=Decimal("0"), ge=0)


class PurchaseRequestUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    description: str | None = None
    estimated_total: Decimal | None = Field(default=None, ge=0)
    status: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in _PR_STATUSES:
            raise ValueError(f"status must be one of {_PR_STATUSES}")
        return v


class PurchaseRequestResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    estimated_total: Decimal
    status: str
    requester_id: uuid.UUID
    approved_by_id: uuid.UUID | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    items: list[PurchaseItemResponse] = []

    model_config = {"from_attributes": True}
