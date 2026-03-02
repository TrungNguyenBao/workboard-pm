import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.wms.schemas.pagination import PaginatedResponse
from app.modules.wms.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.modules.wms.services.product import (
    create_product,
    delete_product,
    get_product,
    list_products,
    update_product,
)

router = APIRouter(tags=["wms-products"])


@router.post(
    "/workspaces/{workspace_id}/products",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: ProductCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_product(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/products",
    response_model=PaginatedResponse[ProductResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_products(db, workspace_id, search, category, is_active, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/products/{product_id}",
    response_model=ProductResponse,
)
async def get(
    workspace_id: uuid.UUID,
    product_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_product(db, product_id)


@router.patch(
    "/workspaces/{workspace_id}/products/{product_id}",
    response_model=ProductResponse,
)
async def update(
    workspace_id: uuid.UUID,
    product_id: uuid.UUID,
    data: ProductUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_product(db, product_id, data)


@router.delete(
    "/workspaces/{workspace_id}/products/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    product_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_product(db, product_id)
