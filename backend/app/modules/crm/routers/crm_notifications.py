import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.crm_notification import CrmNotificationResponse, UnreadCountResponse
from app.modules.crm.schemas.pagination import PaginatedResponse
from app.modules.crm.services.crm_notification import (
    get_unread_count,
    list_notifications,
    mark_all_read,
    mark_read,
)

router = APIRouter(tags=["crm"])


@router.get(
    "/workspaces/{workspace_id}/notifications",
    response_model=PaginatedResponse[CrmNotificationResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    is_read: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_notifications(db, workspace_id, current_user.id, is_read, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/notifications/unread-count",
    response_model=UnreadCountResponse,
)
async def unread_count(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    count = await get_unread_count(db, workspace_id, current_user.id)
    return UnreadCountResponse(count=count)


@router.post(
    "/workspaces/{workspace_id}/notifications/{notification_id}/read",
    response_model=CrmNotificationResponse,
)
async def read_one(
    workspace_id: uuid.UUID,
    notification_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await mark_read(db, notification_id, workspace_id, current_user.id)


@router.post(
    "/workspaces/{workspace_id}/notifications/read-all",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def read_all(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    await mark_all_read(db, workspace_id, current_user.id)
