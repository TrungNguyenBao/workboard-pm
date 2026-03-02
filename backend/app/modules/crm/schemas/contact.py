import uuid

from pydantic import BaseModel, Field


class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    company: str | None = Field(default=None, max_length=255)


class ContactUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    email: str | None = None
    phone: str | None = None
    company: str | None = None


class ContactResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str | None
    phone: str | None
    company: str | None
    workspace_id: uuid.UUID

    model_config = {"from_attributes": True}
