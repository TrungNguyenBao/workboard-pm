import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.schemas.pagination import PaginatedResponse
from app.modules.hrm.schemas.resignation import ResignationCreate, ResignationResponse, ResignationUpdate
from app.modules.hrm.dependencies.rbac import require_hrm_role
from app.modules.hrm.services.resignation import (
    advance_resignation,
    approve_resignation,
    create_resignation,
    delete_resignation,
    get_resignation,
    list_resignations,
    reject_resignation,
    update_resignation,
)

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/resignations",
    response_model=ResignationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: ResignationCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_resignation(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/resignations",
    response_model=PaginatedResponse[ResignationResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = Query(default=None),
    resignation_status: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_resignations(db, workspace_id, employee_id, resignation_status, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/resignations/{resignation_id}",
    response_model=ResignationResponse,
)
async def get_one(
    workspace_id: uuid.UUID,
    resignation_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_resignation(db, resignation_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/resignations/{resignation_id}",
    response_model=ResignationResponse,
)
async def update(
    workspace_id: uuid.UUID,
    resignation_id: uuid.UUID,
    data: ResignationUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_resignation(db, resignation_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/resignations/{resignation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    resignation_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_resignation(db, resignation_id, workspace_id)


@router.post(
    "/workspaces/{workspace_id}/resignations/{resignation_id}/approve",
    response_model=ResignationResponse,
)
async def approve(
    workspace_id: uuid.UUID,
    resignation_id: uuid.UUID,
    current_user: User = Depends(require_hrm_role("hr_manager")),
    db: AsyncSession = Depends(get_db),
):
    return await approve_resignation(db, resignation_id, workspace_id, current_user.id)


@router.post(
    "/workspaces/{workspace_id}/resignations/{resignation_id}/reject",
    response_model=ResignationResponse,
)
async def reject(
    workspace_id: uuid.UUID,
    resignation_id: uuid.UUID,
    current_user: User = Depends(require_hrm_role("hr_manager")),
    db: AsyncSession = Depends(get_db),
):
    return await reject_resignation(db, resignation_id, workspace_id, current_user.id)


VALID_ADVANCE_TARGETS = {"approved", "handover", "exit_interview", "completed", "rejected"}


@router.post(
    "/workspaces/{workspace_id}/resignations/{resignation_id}/advance",
    response_model=ResignationResponse,
)
async def advance(
    workspace_id: uuid.UUID,
    resignation_id: uuid.UUID,
    target_status: str,
    current_user: User = Depends(require_hrm_role("hr_admin")),
    db: AsyncSession = Depends(get_db),
):
    if target_status not in VALID_ADVANCE_TARGETS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid target_status. Must be one of: {VALID_ADVANCE_TARGETS}",
        )
    return await advance_resignation(db, resignation_id, workspace_id, target_status, current_user.id)
