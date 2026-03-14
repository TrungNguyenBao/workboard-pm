import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

PriceComparison = Literal["higher", "similar", "lower"]
CompetitorStatus = Literal["active", "won", "lost"]


class CompetitorCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    strengths: str | None = None
    weaknesses: str | None = None
    price_comparison: PriceComparison | None = None
    status: CompetitorStatus = "active"


class CompetitorUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    strengths: str | None = None
    weaknesses: str | None = None
    price_comparison: PriceComparison | None = None
    status: CompetitorStatus | None = None


class CompetitorResponse(BaseModel):
    id: uuid.UUID
    deal_id: uuid.UUID
    name: str
    strengths: str | None
    weaknesses: str | None
    price_comparison: str | None
    status: str
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
