import uuid

from pydantic import BaseModel, Field


class WorkspaceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")


class WorkspaceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)


class WorkspaceResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    owner_id: uuid.UUID

    model_config = {"from_attributes": True}


class MemberResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    role: str
    workspace_id: uuid.UUID

    model_config = {"from_attributes": True}


class MemberWithUserResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    role: str
    workspace_id: uuid.UUID
    user_email: str
    user_name: str
    user_avatar_url: str | None

    model_config = {"from_attributes": False}


class InviteMemberRequest(BaseModel):
    email: str
    role: str = "member"
