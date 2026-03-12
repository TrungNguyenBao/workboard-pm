import uuid
from typing import Literal

from pydantic import BaseModel

ProjectRole = Literal["owner", "editor", "commenter", "viewer"]


class MemberAdd(BaseModel):
    user_id: uuid.UUID
    role: ProjectRole = "editor"


class MemberUpdate(BaseModel):
    role: ProjectRole


class MemberResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    user_id: uuid.UUID
    user_name: str
    user_email: str
    role: str

    model_config = {"from_attributes": True}
