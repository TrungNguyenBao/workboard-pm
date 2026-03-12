import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.activity import ActivityCreate, ActivityResponse, ActivityUpdate
from app.modules.crm.schemas.pagination import PaginatedResponse
from app.modules.crm.services.activity import (
    create_activity,
    delete_activity,
    get_activity,
    list_activities,
    update_activity,
)

router = APIRouter(tags=["crm"])


@router.post(
    "/workspaces/{workspace_id}/activities",
    response_model=ActivityResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: ActivityCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_activity(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/activities",
    response_model=PaginatedResponse[ActivityResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    type_filter: str | None = Query(default=None, alias="type"),
    contact_id: uuid.UUID | None = Query(default=None),
    deal_id: uuid.UUID | None = Query(default=None),
    lead_id: uuid.UUID | None = Query(default=None),
    assigned_to: uuid.UUID | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_activities(
        db, workspace_id, type_filter, contact_id, deal_id, lead_id, assigned_to, search, page, page_size
    )
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/activities/{activity_id}",
    response_model=ActivityResponse,
)
async def get(
    workspace_id: uuid.UUID,
    activity_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_activity(db, activity_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/activities/{activity_id}",
    response_model=ActivityResponse,
)
async def update(
    workspace_id: uuid.UUID,
    activity_id: uuid.UUID,
    data: ActivityUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_activity(db, activity_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/activities/{activity_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    activity_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_activity(db, activity_id, workspace_id)
