import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.schemas.pagination import PaginatedResponse
from app.modules.hrm.schemas.handover_task import HandoverTaskCreate, HandoverTaskResponse, HandoverTaskUpdate
from app.modules.hrm.services.handover_task import (
    create_handover_task,
    delete_handover_task,
    get_handover_task,
    list_handover_tasks,
    update_handover_task,
)

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/handover-tasks",
    response_model=HandoverTaskResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: HandoverTaskCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_handover_task(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/handover-tasks",
    response_model=PaginatedResponse[HandoverTaskResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    resignation_id: uuid.UUID | None = Query(default=None),
    task_status: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_handover_tasks(db, workspace_id, resignation_id, task_status, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/handover-tasks/{task_id}",
    response_model=HandoverTaskResponse,
)
async def get_one(
    workspace_id: uuid.UUID,
    task_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_handover_task(db, task_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/handover-tasks/{task_id}",
    response_model=HandoverTaskResponse,
)
async def update(
    workspace_id: uuid.UUID,
    task_id: uuid.UUID,
    data: HandoverTaskUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_handover_task(db, task_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/handover-tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    task_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    await delete_handover_task(db, task_id, workspace_id)
