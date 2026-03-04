import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, field_validator

VALID_RELATIONSHIPS = {"self", "manager", "peer", "subordinate"}


class ReviewFeedbackCreate(BaseModel):
    review_id: uuid.UUID
    from_employee_id: uuid.UUID
    relationship_type: str
    scores: dict[str, Any] | None = None
    comments: str | None = None

    @field_validator("relationship_type")
    @classmethod
    def validate_relationship(cls, v: str) -> str:
        if v not in VALID_RELATIONSHIPS:
            raise ValueError(f"relationship_type must be one of {VALID_RELATIONSHIPS}")
        return v


class ReviewFeedbackResponse(BaseModel):
    id: uuid.UUID
    review_id: uuid.UUID
    from_employee_id: uuid.UUID
    relationship_type: str
    scores: dict[str, Any] | None
    comments: str | None
    submitted_at: datetime | None
    workspace_id: uuid.UUID

    model_config = {"from_attributes": True}
