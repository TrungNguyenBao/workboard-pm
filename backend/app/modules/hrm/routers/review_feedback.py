import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.hrm.schemas.review_feedback import ReviewFeedbackCreate, ReviewFeedbackResponse
from app.modules.hrm.services.review_feedback import (
    create_review_feedback,
    list_review_feedback,
)

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/review-feedback",
    response_model=ReviewFeedbackResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: ReviewFeedbackCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_review_feedback(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/review-feedback",
    response_model=list[ReviewFeedbackResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    review_id: uuid.UUID | None = Query(default=None),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await list_review_feedback(db, workspace_id, review_id)
