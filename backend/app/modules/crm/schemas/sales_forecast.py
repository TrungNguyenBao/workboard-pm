import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class SalesForecastCreate(BaseModel):
    owner_id: uuid.UUID
    period: str = Field(pattern=r"^\d{4}-\d{2}$")  # YYYY-MM
    target_amount: float = 0.0


class SalesForecastUpdate(BaseModel):
    target_amount: float | None = None
    committed_amount: float | None = None
    best_case_amount: float | None = None


class SalesForecastResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    period: str
    target_amount: float
    committed_amount: float
    best_case_amount: float
    closed_amount: float
    status: str
    workspace_id: uuid.UUID
    created_by: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ForecastVsActualResponse(BaseModel):
    period: str
    target: float
    actual: float
    attainment_pct: float
    gap: float
