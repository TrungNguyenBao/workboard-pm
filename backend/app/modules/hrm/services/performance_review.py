import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.performance_review import PerformanceReview
from app.modules.hrm.schemas.performance_review import (
    PerformanceReviewCreate,
    PerformanceReviewUpdate,
)


async def create_performance_review(
    db: AsyncSession, workspace_id: uuid.UUID, data: PerformanceReviewCreate
) -> PerformanceReview:
    review = PerformanceReview(workspace_id=workspace_id, **data.model_dump())
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


async def list_performance_reviews(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = None,
    review_status: str | None = None,
    period: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[PerformanceReview], int]:
    q = select(PerformanceReview).where(PerformanceReview.workspace_id == workspace_id)
    count_q = select(func.count(PerformanceReview.id)).where(PerformanceReview.workspace_id == workspace_id)

    if employee_id:
        q = q.where(PerformanceReview.employee_id == employee_id)
        count_q = count_q.where(PerformanceReview.employee_id == employee_id)
    if review_status:
        q = q.where(PerformanceReview.status == review_status)
        count_q = count_q.where(PerformanceReview.status == review_status)
    if period:
        q = q.where(PerformanceReview.period == period)
        count_q = count_q.where(PerformanceReview.period == period)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(PerformanceReview.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_performance_review(
    db: AsyncSession, review_id: uuid.UUID, workspace_id: uuid.UUID
) -> PerformanceReview:
    result = await db.scalars(
        select(PerformanceReview).where(
            PerformanceReview.id == review_id, PerformanceReview.workspace_id == workspace_id
        )
    )
    review = result.first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Performance review not found")
    return review


async def update_performance_review(
    db: AsyncSession, review_id: uuid.UUID, workspace_id: uuid.UUID, data: PerformanceReviewUpdate
) -> PerformanceReview:
    review = await get_performance_review(db, review_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(review, field, value)
    await db.commit()
    await db.refresh(review)
    return review


async def submit_review(
    db: AsyncSession, review_id: uuid.UUID, workspace_id: uuid.UUID
) -> PerformanceReview:
    review = await get_performance_review(db, review_id, workspace_id)
    if review.status != "draft":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only draft reviews can be submitted")
    review.status = "in_progress"
    await db.commit()
    await db.refresh(review)
    return review


async def complete_review(
    db: AsyncSession, review_id: uuid.UUID, workspace_id: uuid.UUID
) -> PerformanceReview:
    review = await get_performance_review(db, review_id, workspace_id)
    if review.status == "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Review already completed")
    review.status = "completed"
    await db.commit()
    await db.refresh(review)
    return review


async def delete_performance_review(
    db: AsyncSession, review_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    review = await get_performance_review(db, review_id, workspace_id)
    await db.delete(review)
    await db.commit()
