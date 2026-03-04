import uuid
from decimal import Decimal

from fastapi import APIRouter, Body, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.schemas.pagination import PaginatedResponse
from app.modules.hrm.schemas.kpi_assignment import KpiAssignmentCreate, KpiAssignmentResponse, KpiAssignmentUpdate
from app.modules.hrm.services.kpi_assignment import (
    complete_kpi_assignment,
    create_kpi_assignment,
    delete_kpi_assignment,
    get_kpi_assignment,
    list_kpi_assignments,
    update_kpi_assignment,
)

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/kpi-assignments",
    response_model=KpiAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: KpiAssignmentCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_kpi_assignment(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/kpi-assignments",
    response_model=PaginatedResponse[KpiAssignmentResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = Query(default=None),
    period: str | None = Query(default=None),
    assignment_status: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_kpi_assignments(
        db, workspace_id, employee_id, period, assignment_status, page, page_size
    )
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/kpi-assignments/{assignment_id}",
    response_model=KpiAssignmentResponse,
)
async def get_one(
    workspace_id: uuid.UUID,
    assignment_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_kpi_assignment(db, assignment_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/kpi-assignments/{assignment_id}",
    response_model=KpiAssignmentResponse,
)
async def update(
    workspace_id: uuid.UUID,
    assignment_id: uuid.UUID,
    data: KpiAssignmentUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_kpi_assignment(db, assignment_id, workspace_id, data)


@router.post(
    "/workspaces/{workspace_id}/kpi-assignments/{assignment_id}/complete",
    response_model=KpiAssignmentResponse,
)
async def complete(
    workspace_id: uuid.UUID,
    assignment_id: uuid.UUID,
    actual_value: Decimal = Body(..., embed=True),
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await complete_kpi_assignment(db, assignment_id, workspace_id, actual_value)


@router.delete(
    "/workspaces/{workspace_id}/kpi-assignments/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    assignment_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_kpi_assignment(db, assignment_id, workspace_id)
