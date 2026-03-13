import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.hrm.schemas.asset_assignment import (
    AssetAssignmentCreate,
    AssetAssignmentResponse,
    AssetAssignmentUpdate,
)
from app.modules.hrm.services.asset_assignment import (
    create_assignment,
    delete_assignment,
    get_assignment,
    list_assignments,
    update_assignment,
)
from app.schemas.pagination import PaginatedResponse

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/asset-assignments",
    response_model=AssetAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: AssetAssignmentCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_assignment(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/asset-assignments",
    response_model=PaginatedResponse[AssetAssignmentResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    asset_id: uuid.UUID | None = Query(default=None),
    employee_id: uuid.UUID | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_assignments(db, workspace_id, asset_id, employee_id, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/asset-assignments/{assignment_id}",
    response_model=AssetAssignmentResponse,
)
async def get(
    workspace_id: uuid.UUID,
    assignment_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_assignment(db, assignment_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/asset-assignments/{assignment_id}",
    response_model=AssetAssignmentResponse,
)
async def update(
    workspace_id: uuid.UUID,
    assignment_id: uuid.UUID,
    data: AssetAssignmentUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_assignment(db, assignment_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/asset-assignments/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    assignment_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_assignment(db, assignment_id, workspace_id)
