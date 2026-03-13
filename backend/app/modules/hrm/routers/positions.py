import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.hrm.schemas.position import PositionCreate, PositionResponse, PositionUpdate
from app.modules.hrm.services.position import (
    create_position,
    delete_position,
    get_position,
    list_positions,
    update_position,
)
from app.schemas.pagination import PaginatedResponse

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/positions",
    response_model=PositionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: PositionCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_position(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/positions",
    response_model=PaginatedResponse[PositionResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    department_id: uuid.UUID | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_positions(db, workspace_id, department_id, search, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/positions/{position_id}",
    response_model=PositionResponse,
)
async def get(
    workspace_id: uuid.UUID,
    position_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_position(db, position_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/positions/{position_id}",
    response_model=PositionResponse,
)
async def update(
    workspace_id: uuid.UUID,
    position_id: uuid.UUID,
    data: PositionUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_position(db, position_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/positions/{position_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    position_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_position(db, position_id, workspace_id)
