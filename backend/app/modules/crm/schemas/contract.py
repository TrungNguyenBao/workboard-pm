import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

ContractStatus = Literal["draft", "active", "expired", "terminated"]
BillingPeriod = Literal["monthly", "quarterly", "annual"]


class ContractCreate(BaseModel):
    account_id: uuid.UUID
    contract_number: str = Field(min_length=1, max_length=50)
    title: str = Field(min_length=1, max_length=255)
    start_date: date
    end_date: date | None = None
    value: float = 0.0
    billing_period: BillingPeriod | None = None
    auto_renewal: bool = False
    signed_date: date | None = None
    notes: str | None = None
    deal_id: uuid.UUID | None = None


class ContractUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    contract_number: str | None = Field(default=None, max_length=50)
    start_date: date | None = None
    end_date: date | None = None
    value: float | None = None
    billing_period: BillingPeriod | None = None
    auto_renewal: bool | None = None
    signed_date: date | None = None
    notes: str | None = None
    deal_id: uuid.UUID | None = None
    account_id: uuid.UUID | None = None


class ContractResponse(BaseModel):
    id: uuid.UUID
    deal_id: uuid.UUID | None
    account_id: uuid.UUID
    contract_number: str
    title: str
    start_date: date
    end_date: date | None
    value: float
    billing_period: str | None
    auto_renewal: bool
    status: str
    signed_date: date | None
    notes: str | None
    workspace_id: uuid.UUID
    created_by: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
