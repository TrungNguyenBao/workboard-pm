import uuid
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, field_validator

VALID_STATUSES = {"draft", "sent", "accepted", "rejected", "expired"}


class OfferCreate(BaseModel):
    candidate_id: uuid.UUID
    position_title: str
    offered_salary: Decimal
    start_date: date
    expiry_date: date | None = None
    status: str = "draft"
    notes: str | None = None
    contract_type: str | None = None
    benefits: dict | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v


class OfferUpdate(BaseModel):
    position_title: str | None = None
    offered_salary: Decimal | None = None
    start_date: date | None = None
    expiry_date: date | None = None
    status: str | None = None
    notes: str | None = None
    contract_type: str | None = None
    benefits: dict | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v


class OfferResponse(BaseModel):
    id: uuid.UUID
    candidate_id: uuid.UUID
    position_title: str
    offered_salary: Decimal
    start_date: date
    expiry_date: date | None
    status: str
    notes: str | None
    contract_type: str | None = None
    benefits: dict | None = None
    workspace_id: uuid.UUID

    model_config = {"from_attributes": True}
