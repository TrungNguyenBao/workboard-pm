import uuid
from datetime import datetime

from pydantic import BaseModel, Field

VALID_FIELD_TYPES = {"text", "number", "date", "single_select", "multi_select", "checkbox", "url"}


class SelectOption(BaseModel):
    id: str
    label: str
    color: str = "#5E6AD2"


class CustomFieldCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    field_type: str
    required: bool = False
    description: str | None = Field(default=None, max_length=500)
    options: list[SelectOption] | None = None
    position: float | None = None

    def model_post_init(self, __context) -> None:
        if self.field_type not in VALID_FIELD_TYPES:
            raise ValueError(f"field_type must be one of: {', '.join(sorted(VALID_FIELD_TYPES))}")


class CustomFieldUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    required: bool | None = None
    description: str | None = Field(default=None, max_length=500)
    options: list[SelectOption] | None = None
    position: float | None = None


class CustomFieldResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    created_by_id: uuid.UUID
    name: str
    field_type: str
    required: bool
    description: str | None
    options: list[SelectOption] | None
    position: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
