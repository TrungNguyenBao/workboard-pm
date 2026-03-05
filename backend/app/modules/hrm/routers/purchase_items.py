import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.schemas.pagination import PaginatedResponse
from app.modules.hrm.schemas.purchase_item import (
    PurchaseItemCreate,
    PurchaseItemResponse,
    PurchaseItemUpdate,
)
from app.modules.hrm.services.purchase_item import (
    create_purchase_item,
    delete_purchase_item,
    get_purchase_item,
    list_purchase_items,
    update_purchase_item,
)

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/purchase-items",
    response_model=PurchaseItemResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: PurchaseItemCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_purchase_item(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/purchase-items",
    response_model=PaginatedResponse[PurchaseItemResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    request_id: uuid.UUID | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_purchase_items(db, workspace_id, request_id, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/purchase-items/{item_id}",
    response_model=PurchaseItemResponse,
)
async def get(
    workspace_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_purchase_item(db, item_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/purchase-items/{item_id}",
    response_model=PurchaseItemResponse,
)
async def update(
    workspace_id: uuid.UUID,
    item_id: uuid.UUID,
    data: PurchaseItemUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_purchase_item(db, item_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/purchase-items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    await delete_purchase_item(db, item_id, workspace_id)
