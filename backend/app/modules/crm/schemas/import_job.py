import uuid
from datetime import datetime

from pydantic import BaseModel


class ImportJobResponse(BaseModel):
    id: uuid.UUID
    type: str
    file_name: str
    file_url: str
    status: str
    total_rows: int
    imported_rows: int
    failed_rows: int
    error_log: dict | None
    column_mapping: dict | None
    created_by: uuid.UUID | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
