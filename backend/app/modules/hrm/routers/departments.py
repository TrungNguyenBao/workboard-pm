import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.hrm.schemas.department import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
)
from app.modules.hrm.services.department import (
    create_department,
    delete_department,
    get_department,
    list_departments,
    update_department,
)

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/departments",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: DepartmentCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_department(db, workspace_id, data)


@router.get("/workspaces/{workspace_id}/departments", response_model=list[DepartmentResponse])
async def list_(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await list_departments(db, workspace_id)


@router.get(
    "/workspaces/{workspace_id}/departments/{department_id}",
    response_model=DepartmentResponse,
)
async def get(
    workspace_id: uuid.UUID,
    department_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_department(db, department_id)


@router.patch(
    "/workspaces/{workspace_id}/departments/{department_id}",
    response_model=DepartmentResponse,
)
async def update(
    workspace_id: uuid.UUID,
    department_id: uuid.UUID,
    data: DepartmentUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_department(db, department_id, data)


@router.delete(
    "/workspaces/{workspace_id}/departments/{department_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    department_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_department(db, department_id)
