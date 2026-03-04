import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.interview import Interview
from app.modules.hrm.schemas.interview import InterviewCreate, InterviewUpdate


async def create_interview(
    db: AsyncSession, workspace_id: uuid.UUID, data: InterviewCreate
) -> Interview:
    i = Interview(workspace_id=workspace_id, **data.model_dump())
    db.add(i)
    await db.commit()
    await db.refresh(i)
    return i


async def list_interviews(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    candidate_id: uuid.UUID | None = None,
    iv_status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Interview], int]:
    q = select(Interview).where(Interview.workspace_id == workspace_id)
    count_q = select(func.count(Interview.id)).where(Interview.workspace_id == workspace_id)

    if candidate_id:
        q = q.where(Interview.candidate_id == candidate_id)
        count_q = count_q.where(Interview.candidate_id == candidate_id)
    if iv_status:
        q = q.where(Interview.status == iv_status)
        count_q = count_q.where(Interview.status == iv_status)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Interview.scheduled_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_interview(
    db: AsyncSession, interview_id: uuid.UUID, workspace_id: uuid.UUID
) -> Interview:
    result = await db.scalars(
        select(Interview).where(Interview.id == interview_id, Interview.workspace_id == workspace_id)
    )
    i = result.first()
    if not i:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
    return i


async def update_interview(
    db: AsyncSession, interview_id: uuid.UUID, workspace_id: uuid.UUID, data: InterviewUpdate
) -> Interview:
    i = await get_interview(db, interview_id, workspace_id)
    payload = data.model_dump(exclude_none=True)
    if "score" in payload and payload["score"] is not None:
        if not (1 <= payload["score"] <= 5):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Score must be between 1 and 5")
    for field, value in payload.items():
        setattr(i, field, value)
    await db.commit()
    await db.refresh(i)
    return i


async def complete_interview(
    db: AsyncSession, interview_id: uuid.UUID, workspace_id: uuid.UUID, feedback: str | None, score: int | None
) -> Interview:
    i = await get_interview(db, interview_id, workspace_id)
    if i.status != "scheduled":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only scheduled interviews can be completed")
    if score is not None and not (1 <= score <= 5):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Score must be between 1 and 5")
    i.status = "completed"
    i.feedback = feedback
    i.score = score
    await db.commit()
    await db.refresh(i)
    return i


async def delete_interview(
    db: AsyncSession, interview_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    i = await get_interview(db, interview_id, workspace_id)
    await db.delete(i)
    await db.commit()
