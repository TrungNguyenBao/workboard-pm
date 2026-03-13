import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.hrm.schemas.performance_review import (
    PerformanceReviewCreate,
    PerformanceReviewResponse,
    PerformanceReviewUpdate,
)
from app.modules.hrm.services.performance_review import (
    complete_review,
    create_performance_review,
    delete_performance_review,
    get_performance_review,
    list_performance_reviews,
    submit_review,
    update_performance_review,
)
from app.schemas.pagination import PaginatedResponse

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/performance-reviews",
    response_model=PerformanceReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: PerformanceReviewCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_performance_review(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/performance-reviews",
    response_model=PaginatedResponse[PerformanceReviewResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = Query(default=None),
    review_status: str | None = Query(default=None, alias="status"),
    period: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_performance_reviews(
        db, workspace_id, employee_id, review_status, period, page, page_size
    )
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/performance-reviews/{review_id}",
    response_model=PerformanceReviewResponse,
)
async def get_one(
    workspace_id: uuid.UUID,
    review_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_performance_review(db, review_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/performance-reviews/{review_id}",
    response_model=PerformanceReviewResponse,
)
async def update(
    workspace_id: uuid.UUID,
    review_id: uuid.UUID,
    data: PerformanceReviewUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_performance_review(db, review_id, workspace_id, data)


@router.post(
    "/workspaces/{workspace_id}/performance-reviews/{review_id}/submit",
    response_model=PerformanceReviewResponse,
)
async def submit(
    workspace_id: uuid.UUID,
    review_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await submit_review(db, review_id, workspace_id)


@router.post(
    "/workspaces/{workspace_id}/performance-reviews/{review_id}/complete",
    response_model=PerformanceReviewResponse,
)
async def complete(
    workspace_id: uuid.UUID,
    review_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await complete_review(db, review_id, workspace_id)


@router.delete(
    "/workspaces/{workspace_id}/performance-reviews/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    review_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_performance_review(db, review_id, workspace_id)
