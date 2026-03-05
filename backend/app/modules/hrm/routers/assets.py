import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.schemas.pagination import PaginatedResponse
from app.modules.hrm.schemas.asset import AssetCreate, AssetResponse, AssetUpdate
from app.modules.hrm.services.asset import (
    create_asset,
    delete_asset,
    get_asset,
    list_assets,
    update_asset,
)

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/assets",
    response_model=AssetResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: AssetCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_asset(db, workspace_id, data)


@router.get("/workspaces/{workspace_id}/assets", response_model=PaginatedResponse[AssetResponse])
async def list_(
    workspace_id: uuid.UUID,
    asset_status: str | None = Query(default=None, alias="status"),
    category: str | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_assets(db, workspace_id, asset_status, category, search, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/workspaces/{workspace_id}/assets/{asset_id}", response_model=AssetResponse)
async def get(
    workspace_id: uuid.UUID,
    asset_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_asset(db, asset_id, workspace_id)


@router.patch("/workspaces/{workspace_id}/assets/{asset_id}", response_model=AssetResponse)
async def update(
    workspace_id: uuid.UUID,
    asset_id: uuid.UUID,
    data: AssetUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_asset(db, asset_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/assets/{asset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    asset_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_asset(db, asset_id, workspace_id)
