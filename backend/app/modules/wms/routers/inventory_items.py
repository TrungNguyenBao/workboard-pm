import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.wms.schemas.inventory_item import (
    InventoryItemCreate,
    InventoryItemResponse,
    InventoryItemUpdate,
)
from app.modules.wms.schemas.pagination import PaginatedResponse
from app.modules.wms.services.inventory_item import (
    create_inventory_item,
    delete_inventory_item,
    get_inventory_item,
    list_inventory_items,
    update_inventory_item,
)

router = APIRouter(tags=["wms-inventory"])


@router.post(
    "/workspaces/{workspace_id}/inventory-items",
    response_model=InventoryItemResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: InventoryItemCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_inventory_item(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/inventory-items",
    response_model=PaginatedResponse[InventoryItemResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    warehouse_id: uuid.UUID | None = Query(default=None),
    product_id: uuid.UUID | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_inventory_items(db, workspace_id, warehouse_id, product_id, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/inventory-items/{item_id}",
    response_model=InventoryItemResponse,
)
async def get(
    workspace_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_inventory_item(db, item_id)


@router.patch(
    "/workspaces/{workspace_id}/inventory-items/{item_id}",
    response_model=InventoryItemResponse,
)
async def update(
    workspace_id: uuid.UUID,
    item_id: uuid.UUID,
    data: InventoryItemUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_inventory_item(db, item_id, data)


@router.delete(
    "/workspaces/{workspace_id}/inventory-items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    await delete_inventory_item(db, item_id)
