import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.wms.schemas.device import DeviceCreate, DeviceResponse, DeviceUpdate
from app.modules.wms.schemas.pagination import PaginatedResponse
from app.modules.wms.services.device import (
    create_device,
    delete_device,
    get_device,
    list_devices,
    update_device,
)

router = APIRouter(tags=["wms-devices"])


@router.post(
    "/workspaces/{workspace_id}/devices",
    response_model=DeviceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: DeviceCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_device(db, workspace_id, data.model_dump())


@router.get(
    "/workspaces/{workspace_id}/devices",
    response_model=PaginatedResponse[DeviceResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    search: str | None = Query(default=None),
    product_id: uuid.UUID | None = Query(default=None),
    warehouse_id: uuid.UUID | None = Query(default=None),
    device_status: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_devices(
        db, workspace_id, search, product_id, warehouse_id, device_status, page, page_size
    )
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/devices/{device_id}",
    response_model=DeviceResponse,
)
async def get(
    workspace_id: uuid.UUID,
    device_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_device(db, device_id)


@router.patch(
    "/workspaces/{workspace_id}/devices/{device_id}",
    response_model=DeviceResponse,
)
async def update(
    workspace_id: uuid.UUID,
    device_id: uuid.UUID,
    data: DeviceUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_device(db, device_id, data.model_dump(exclude_none=True))


@router.delete(
    "/workspaces/{workspace_id}/devices/{device_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    device_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_device(db, device_id)
