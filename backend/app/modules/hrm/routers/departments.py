import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.hrm.schemas.department import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentTreeNode,
    DepartmentUpdate,
)
from app.modules.hrm.services.department import (
    create_department,
    delete_department,
    get_department,
    list_departments,
    update_department,
)
from app.modules.hrm.services.org_tree import get_headcount_summary, get_org_tree
from app.schemas.pagination import PaginatedResponse

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


@router.get(
    "/workspaces/{workspace_id}/departments",
    response_model=PaginatedResponse[DepartmentResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_departments(db, workspace_id, search, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


# Static sub-paths must come before /{department_id} to avoid route conflicts
@router.get(
    "/workspaces/{workspace_id}/departments/tree",
    response_model=list[DepartmentTreeNode],
)
async def get_tree(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_org_tree(db, workspace_id)


@router.get(
    "/workspaces/{workspace_id}/departments/headcount",
    response_model=list[dict],
)
async def get_headcount(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_headcount_summary(db, workspace_id)


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
    return await get_department(db, department_id, workspace_id)


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
    return await update_department(db, department_id, workspace_id, data)


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
    await delete_department(db, department_id, workspace_id)
