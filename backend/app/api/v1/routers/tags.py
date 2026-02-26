import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.tag import Tag
from app.models.user import User
from app.schemas.task import TagCreate, TagResponse

router = APIRouter(prefix="/workspaces/{workspace_id}/tags", tags=["tags"])


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
