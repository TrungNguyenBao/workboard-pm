import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    company: str | None = Field(default=None, max_length=255)
    account_id: uuid.UUID | None = None


class ContactUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    account_id: uuid.UUID | None = None


class ContactResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr | None
    phone: str | None
    company: str | None
    account_id: uuid.UUID | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
