import uuid

from fastapi import APIRouter, Body, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.hrm.schemas.interview import (
    InterviewCreate,
    InterviewResponse,
    InterviewUpdate,
)
from app.modules.hrm.services.interview import (
    complete_interview,
    create_interview,
    delete_interview,
    get_interview,
    list_interviews,
    update_interview,
)
from app.schemas.pagination import PaginatedResponse

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/interviews",
    response_model=InterviewResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: InterviewCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_interview(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/interviews",
    response_model=PaginatedResponse[InterviewResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    candidate_id: uuid.UUID | None = Query(default=None),
    iv_status: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_interviews(db, workspace_id, candidate_id, iv_status, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/interviews/{interview_id}",
    response_model=InterviewResponse,
)
async def get_one(
    workspace_id: uuid.UUID,
    interview_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_interview(db, interview_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/interviews/{interview_id}",
    response_model=InterviewResponse,
)
async def update(
    workspace_id: uuid.UUID,
    interview_id: uuid.UUID,
    data: InterviewUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_interview(db, interview_id, workspace_id, data)


@router.post(
    "/workspaces/{workspace_id}/interviews/{interview_id}/complete",
    response_model=InterviewResponse,
)
async def complete(
    workspace_id: uuid.UUID,
    interview_id: uuid.UUID,
    feedback: str | None = Body(default=None, embed=True),
    score: int | None = Body(default=None, embed=True),
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await complete_interview(db, interview_id, workspace_id, feedback, score)


@router.delete(
    "/workspaces/{workspace_id}/interviews/{interview_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    interview_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    await delete_interview(db, interview_id, workspace_id)
