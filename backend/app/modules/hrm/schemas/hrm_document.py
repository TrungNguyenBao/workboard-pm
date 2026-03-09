import uuid
from datetime import datetime

from pydantic import BaseModel


class HrmDocumentResponse(BaseModel):
    id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    filename: str
    file_size: int
    mime_type: str
    uploaded_by_id: uuid.UUID
    workspace_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}
