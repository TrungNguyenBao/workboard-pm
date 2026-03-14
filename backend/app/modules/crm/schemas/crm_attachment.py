import uuid
from datetime import datetime

from pydantic import BaseModel


class CrmAttachmentResponse(BaseModel):
    id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    file_name: str
    file_url: str
    file_size: int | None
    file_type: str
    category: str
    uploaded_by: uuid.UUID | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
