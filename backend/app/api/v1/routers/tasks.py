import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_project_role
from app.models.user import User
from app.schemas.task import (
    TaskCreate,
    TaskMoveRequest,
    TaskResponse,
    TaskUpdate,
)
from app.services.task import (
    add_follower,
    add_tag,
    create_task,
    delete_task,
    get_task,
    list_tasks,
    move_task,
    remove_follower,
    remove_tag,
    search_tasks,
    update_task,
)

router = APIRouter(prefix="/projects/{project_id}/tasks", tags=["tasks"])


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create(
    project_id: uuid.UUID,
    data: TaskCreate,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    return await create_task(db, project_id, data, current_user)


@router.get("", response_model=list[TaskResponse])
async def list_(
    project_id: uuid.UUID,
    section_id: uuid.UUID | None = Query(default=None),
    include_subtasks: bool = Query(default=False),
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await list_tasks(db, project_id, section_id, include_subtasks)


@router.get("/search", response_model=list[TaskResponse])
async def search(
    project_id: uuid.UUID,
    q: str = Query(min_length=1),
    limit: int = Query(default=20, le=100),
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await search_tasks(db, project_id, q, limit)


@router.get("/{task_id}", response_model=TaskResponse)
async def get(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await get_task(db, task_id)


@router.patch("/{task_id}", response_model=TaskResponse)
async def update(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    data: TaskUpdate,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    return await update_task(db, task_id, data)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    await delete_task(db, task_id)


@router.patch("/{task_id}/move", response_model=TaskResponse)
async def move(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    data: TaskMoveRequest,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    return await move_task(db, task_id, data.section_id, data.position)


@router.post("/{task_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def attach_tag(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    tag_id: uuid.UUID,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    await add_tag(db, task_id, tag_id)


@router.delete("/{task_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def detach_tag(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    tag_id: uuid.UUID,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    await remove_tag(db, task_id, tag_id)


@router.post("/{task_id}/followers", status_code=status.HTTP_204_NO_CONTENT)
async def follow(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    await add_follower(db, task_id, current_user.id)


@router.delete("/{task_id}/followers", status_code=status.HTTP_204_NO_CONTENT)
async def unfollow(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    await remove_follower(db, task_id, current_user.id)
