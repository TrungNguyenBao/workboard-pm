import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.pms.models.tag import Tag
from app.modules.pms.models.task import TaskTag
from app.modules.pms.schemas.task import TagCreate, TagResponse

router = APIRouter(prefix="/workspaces/{workspace_id}/tags", tags=["tags"])


class TagUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    color: str | None = None


@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create(
    workspace_id: uuid.UUID,
    data: TagCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    tag = Tag(workspace_id=workspace_id, **data.model_dump())
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return tag


@router.get("", response_model=list[TagResponse])
async def list_(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.scalars(select(Tag).where(Tag.workspace_id == workspace_id))
    return list(result.all())


@router.patch("/{tag_id}", response_model=TagResponse)
async def update(
    workspace_id: uuid.UUID,
    tag_id: uuid.UUID,
    data: TagUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    tag = await db.scalar(
        select(Tag).where(Tag.id == tag_id, Tag.workspace_id == workspace_id)
    )
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    if data.name is not None:
        tag.name = data.name
    if data.color is not None:
        tag.color = data.color
    await db.commit()
    await db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    workspace_id: uuid.UUID,
    tag_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    tag = await db.scalar(
        select(Tag).where(Tag.id == tag_id, Tag.workspace_id == workspace_id)
    )
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    # Remove all task associations first
    await db.execute(delete(TaskTag).where(TaskTag.tag_id == tag_id))
    await db.delete(tag)
    await db.commit()
