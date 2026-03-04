import uuid

from pydantic import BaseModel


class KpiTemplateCreate(BaseModel):
    name: str
    description: str | None = None
    category: str | None = None
    measurement_unit: str | None = None


class KpiTemplateUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    measurement_unit: str | None = None


class KpiTemplateResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    category: str | None
    measurement_unit: str | None
    workspace_id: uuid.UUID

    model_config = {"from_attributes": True}
