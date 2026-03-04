import uuid
from decimal import Decimal

from pydantic import BaseModel, Field


class PerformanceReviewCreate(BaseModel):
    employee_id: uuid.UUID
    reviewer_id: uuid.UUID
    period: str


class PerformanceReviewUpdate(BaseModel):
    overall_score: Decimal | None = Field(default=None, ge=1, le=5)
    status: str | None = None
    comments: str | None = None


class PerformanceReviewResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    reviewer_id: uuid.UUID
    period: str
    overall_score: Decimal | None
    status: str
    comments: str | None
    workspace_id: uuid.UUID

    model_config = {"from_attributes": True}
