import uuid

from fastapi import APIRouter, Body, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.schemas.pagination import PaginatedResponse
from app.modules.hrm.schemas.candidate import (
    CandidateCreate,
    CandidateResponse,
    CandidateUpdate,
)
from app.modules.hrm.services.candidate import (
    create_candidate,
    delete_candidate,
    get_candidate,
    list_candidates,
    update_candidate,
    update_candidate_status,
)

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/candidates",
    response_model=CandidateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: CandidateCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_candidate(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/candidates",
    response_model=PaginatedResponse[CandidateResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    recruitment_request_id: uuid.UUID | None = Query(default=None),
    cand_status: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_candidates(db, workspace_id, recruitment_request_id, cand_status, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/candidates/{candidate_id}",
    response_model=CandidateResponse,
)
async def get_one(
    workspace_id: uuid.UUID,
    candidate_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_candidate(db, candidate_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/candidates/{candidate_id}",
    response_model=CandidateResponse,
)
async def update(
    workspace_id: uuid.UUID,
    candidate_id: uuid.UUID,
    data: CandidateUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_candidate(db, candidate_id, workspace_id, data)


@router.post(
    "/workspaces/{workspace_id}/candidates/{candidate_id}/update-status",
    response_model=CandidateResponse,
)
async def update_status(
    workspace_id: uuid.UUID,
    candidate_id: uuid.UUID,
    new_status: str = Body(..., embed=True),
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_candidate_status(db, candidate_id, workspace_id, new_status)


@router.delete(
    "/workspaces/{workspace_id}/candidates/{candidate_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    candidate_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_candidate(db, candidate_id, workspace_id)
