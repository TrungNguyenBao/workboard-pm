import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.modules.pms.dependencies.rbac import require_project_role
from app.modules.pms.schemas.comment import CommentCreate, CommentResponse, CommentUpdate
from app.modules.pms.services.comment import (
    create_comment,
    delete_comment,
    list_comments,
    update_comment,
)

router = APIRouter(prefix="/projects/{project_id}/tasks/{task_id}/comments", tags=["comments"])


@router.post("", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    data: CommentCreate,
    current_user: User = Depends(require_project_role("commenter")),
    db: AsyncSession = Depends(get_db),
):
    return await create_comment(db, task_id, data, current_user)


@router.get("", response_model=list[CommentResponse])
async def list_(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await list_comments(db, task_id)


@router.patch("/{comment_id}", response_model=CommentResponse)
async def update(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    comment_id: uuid.UUID,
    data: CommentUpdate,
    current_user: User = Depends(require_project_role("commenter")),
    db: AsyncSession = Depends(get_db),
):
    return await update_comment(db, comment_id, data, current_user)


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    comment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await delete_comment(db, comment_id, current_user)
