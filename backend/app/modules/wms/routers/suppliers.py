import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.wms.schemas.pagination import PaginatedResponse
from app.modules.wms.schemas.supplier import SupplierCreate, SupplierResponse, SupplierUpdate
from app.modules.wms.services.supplier import (
    create_supplier,
    delete_supplier,
    get_supplier,
    list_suppliers,
    update_supplier,
)

router = APIRouter(tags=["wms-suppliers"])


@router.post(
    "/workspaces/{workspace_id}/suppliers",
    response_model=SupplierResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: SupplierCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_supplier(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/suppliers",
    response_model=PaginatedResponse[SupplierResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    search: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_suppliers(db, workspace_id, search, is_active, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/suppliers/{supplier_id}",
    response_model=SupplierResponse,
)
async def get(
    workspace_id: uuid.UUID,
    supplier_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_supplier(db, supplier_id)


@router.patch(
    "/workspaces/{workspace_id}/suppliers/{supplier_id}",
    response_model=SupplierResponse,
)
async def update(
    workspace_id: uuid.UUID,
    supplier_id: uuid.UUID,
    data: SupplierUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_supplier(db, supplier_id, data)


@router.delete(
    "/workspaces/{workspace_id}/suppliers/{supplier_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    supplier_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_supplier(db, supplier_id)
