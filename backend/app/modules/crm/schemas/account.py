import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AccountCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    industry: str | None = Field(default=None, max_length=100)
    total_revenue: float = 0.0
    status: str = Field(default="active", max_length=50)
    website: str | None = Field(default=None, max_length=500)
    address: str | None = Field(default=None, max_length=500)


class AccountUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    industry: str | None = None
    total_revenue: float | None = None
    status: str | None = Field(default=None, max_length=50)
    website: str | None = None
    address: str | None = None


class AccountResponse(BaseModel):
    id: uuid.UUID
    name: str
    industry: str | None
    total_revenue: float
    status: str
    website: str | None
    address: str | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
