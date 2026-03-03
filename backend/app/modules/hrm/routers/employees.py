import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.schemas.pagination import PaginatedResponse
from app.modules.hrm.schemas.employee import EmployeeCreate, EmployeeResponse, EmployeeUpdate
from app.modules.hrm.services.employee import (
    create_employee,
    delete_employee,
    get_employee,
    list_employees,
    update_employee,
)

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/employees",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: EmployeeCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_employee(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/employees",
    response_model=PaginatedResponse[EmployeeResponse],
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
    items, total = await list_employees(db, workspace_id, department_id, search, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/employees/{employee_id}",
    response_model=EmployeeResponse,
)
async def get(
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_employee(db, employee_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/employees/{employee_id}",
    response_model=EmployeeResponse,
)
async def update(
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID,
    data: EmployeeUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_employee(db, employee_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/employees/{employee_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_employee(db, employee_id, workspace_id)
