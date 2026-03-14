import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

ContactRole = Literal["decision_maker", "influencer", "champion", "user", "evaluator"]


class DealContactRoleCreate(BaseModel):
    contact_id: uuid.UUID
    role: ContactRole
    is_primary: bool = False


class DealContactRoleUpdate(BaseModel):
    role: ContactRole | None = None
    is_primary: bool | None = None


class DealContactRoleResponse(BaseModel):
    id: uuid.UUID
    deal_id: uuid.UUID
    contact_id: uuid.UUID
    role: str
    is_primary: bool
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
