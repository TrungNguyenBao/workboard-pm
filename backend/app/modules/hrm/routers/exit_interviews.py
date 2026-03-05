import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.hrm.schemas.exit_interview import ExitInterviewCreate, ExitInterviewResponse, ExitInterviewUpdate
from app.modules.hrm.services.exit_interview import (
    create_exit_interview,
    get_exit_interview,
    get_exit_interview_by_resignation,
    update_exit_interview,
)

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/exit-interviews",
    response_model=ExitInterviewResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: ExitInterviewCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_exit_interview(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/exit-interviews/by-resignation/{resignation_id}",
    response_model=ExitInterviewResponse,
)
async def get_by_resignation(
    workspace_id: uuid.UUID,
    resignation_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_exit_interview_by_resignation(db, resignation_id, workspace_id)


@router.get(
    "/workspaces/{workspace_id}/exit-interviews/{exit_interview_id}",
    response_model=ExitInterviewResponse,
)
async def get_one(
    workspace_id: uuid.UUID,
    exit_interview_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_exit_interview(db, exit_interview_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/exit-interviews/{exit_interview_id}",
    response_model=ExitInterviewResponse,
)
async def update(
    workspace_id: uuid.UUID,
    exit_interview_id: uuid.UUID,
    data: ExitInterviewUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_exit_interview(db, exit_interview_id, workspace_id, data)
