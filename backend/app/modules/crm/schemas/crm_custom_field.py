import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

FieldType = Literal["text", "number", "date", "select", "multi_select"]
EntityType = Literal["lead", "deal", "contact", "account"]


class CrmCustomFieldCreate(BaseModel):
    entity_type: EntityType
    field_name: str = Field(min_length=1, max_length=100)
    field_label: str = Field(min_length=1, max_length=255)
    field_type: FieldType = "text"
    options: list[str] | None = None
    is_required: bool = False
    position: int = 0


class CrmCustomFieldUpdate(BaseModel):
    field_label: str | None = Field(default=None, max_length=255)
    field_type: FieldType | None = None
    options: list[str] | None = None
    is_required: bool | None = None
    position: int | None = None


class CrmCustomFieldResponse(BaseModel):
    id: uuid.UUID
    entity_type: str
    field_name: str
    field_label: str
    field_type: str
    options: Any | None
    is_required: bool
    position: int
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
