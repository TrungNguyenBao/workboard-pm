import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.pagination import PaginatedResponse
from app.modules.crm.schemas.product_service import (
    ProductServiceCreate,
    ProductServiceResponse,
    ProductServiceUpdate,
)
from app.modules.crm.services.product_service import (
    create_product_service,
    deactivate_product_service,
    get_product_service,
    list_product_services,
    update_product_service,
)

router = APIRouter(tags=["crm"])


@router.post(
    "/workspaces/{workspace_id}/products",
    response_model=ProductServiceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: ProductServiceCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_product_service(db, workspace_id, data, created_by=current_user.id)


@router.get("/workspaces/{workspace_id}/products", response_model=PaginatedResponse[ProductServiceResponse])
async def list_(
    workspace_id: uuid.UUID,
    type: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_product_services(db, workspace_id, type, is_active, search, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/workspaces/{workspace_id}/products/{product_id}", response_model=ProductServiceResponse)
async def get(
    workspace_id: uuid.UUID,
    product_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_product_service(db, product_id, workspace_id)


@router.patch("/workspaces/{workspace_id}/products/{product_id}", response_model=ProductServiceResponse)
async def update(
    workspace_id: uuid.UUID,
    product_id: uuid.UUID,
    data: ProductServiceUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_product_service(db, product_id, workspace_id, data)


@router.delete("/workspaces/{workspace_id}/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    workspace_id: uuid.UUID,
    product_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    await deactivate_product_service(db, product_id, workspace_id)
