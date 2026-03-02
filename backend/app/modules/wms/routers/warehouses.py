import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.wms.schemas.warehouse import WarehouseCreate, WarehouseResponse, WarehouseUpdate
from app.modules.wms.services.warehouse import (
    create_warehouse,
    delete_warehouse,
    get_warehouse,
    list_warehouses,
    update_warehouse,
)

router = APIRouter(tags=["wms"])


@router.post(
    "/workspaces/{workspace_id}/warehouses",
    response_model=WarehouseResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: WarehouseCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_warehouse(db, workspace_id, data)


@router.get("/workspaces/{workspace_id}/warehouses", response_model=list[WarehouseResponse])
async def list_(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await list_warehouses(db, workspace_id)


@router.get("/workspaces/{workspace_id}/warehouses/{warehouse_id}", response_model=WarehouseResponse)
async def get(
    workspace_id: uuid.UUID,
    warehouse_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_warehouse(db, warehouse_id)


@router.patch("/workspaces/{workspace_id}/warehouses/{warehouse_id}", response_model=WarehouseResponse)
async def update(
    workspace_id: uuid.UUID,
    warehouse_id: uuid.UUID,
    data: WarehouseUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_warehouse(db, warehouse_id, data)


@router.delete(
    "/workspaces/{workspace_id}/warehouses/{warehouse_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    warehouse_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_warehouse(db, warehouse_id)
