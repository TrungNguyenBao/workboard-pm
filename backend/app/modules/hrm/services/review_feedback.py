import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.review_feedback import ReviewFeedback
from app.modules.hrm.schemas.review_feedback import ReviewFeedbackCreate


async def create_review_feedback(
    db: AsyncSession, workspace_id: uuid.UUID, data: ReviewFeedbackCreate
) -> ReviewFeedback:
    feedback = ReviewFeedback(
        workspace_id=workspace_id,
        submitted_at=datetime.now(timezone.utc),
        **data.model_dump(),
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return feedback


async def list_review_feedback(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    review_id: uuid.UUID | None = None,
) -> list[ReviewFeedback]:
    q = select(ReviewFeedback).where(ReviewFeedback.workspace_id == workspace_id)
    if review_id:
        q = q.where(ReviewFeedback.review_id == review_id)
    result = await db.scalars(q.order_by(ReviewFeedback.submitted_at.asc()))
    return list(result.all())


async def get_review_feedback(
    db: AsyncSession, feedback_id: uuid.UUID, workspace_id: uuid.UUID
) -> ReviewFeedback:
    result = await db.scalars(
        select(ReviewFeedback).where(
            ReviewFeedback.id == feedback_id, ReviewFeedback.workspace_id == workspace_id
        )
    )
    obj = result.first()
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review feedback not found")
    return obj
