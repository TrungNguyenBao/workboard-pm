import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.candidate import Candidate
from app.modules.hrm.schemas.candidate import CandidateCreate, CandidateUpdate

PIPELINE_ORDER = ["applied", "screening", "interviewing", "offered", "hired", "rejected"]


async def create_candidate(
    db: AsyncSession, workspace_id: uuid.UUID, data: CandidateCreate
) -> Candidate:
    c = Candidate(workspace_id=workspace_id, **data.model_dump())
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return c


async def list_candidates(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    recruitment_request_id: uuid.UUID | None = None,
    cand_status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Candidate], int]:
    q = select(Candidate).where(Candidate.workspace_id == workspace_id)
    count_q = select(func.count(Candidate.id)).where(Candidate.workspace_id == workspace_id)

    if recruitment_request_id:
        q = q.where(Candidate.recruitment_request_id == recruitment_request_id)
        count_q = count_q.where(Candidate.recruitment_request_id == recruitment_request_id)
    if cand_status:
        q = q.where(Candidate.status == cand_status)
        count_q = count_q.where(Candidate.status == cand_status)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Candidate.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_candidate(
    db: AsyncSession, candidate_id: uuid.UUID, workspace_id: uuid.UUID
) -> Candidate:
    result = await db.scalars(
        select(Candidate).where(Candidate.id == candidate_id, Candidate.workspace_id == workspace_id)
    )
    c = result.first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    return c


async def update_candidate(
    db: AsyncSession, candidate_id: uuid.UUID, workspace_id: uuid.UUID, data: CandidateUpdate
) -> Candidate:
    c = await get_candidate(db, candidate_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(c, field, value)
    await db.commit()
    await db.refresh(c)
    return c


async def update_candidate_status(
    db: AsyncSession, candidate_id: uuid.UUID, workspace_id: uuid.UUID, new_status: str
) -> Candidate:
    c = await get_candidate(db, candidate_id, workspace_id)
    if new_status not in PIPELINE_ORDER:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")
    # hired/rejected can come from any status; otherwise enforce forward-only progression
    if new_status not in ("hired", "rejected"):
        current_idx = PIPELINE_ORDER.index(c.status) if c.status in PIPELINE_ORDER else -1
        new_idx = PIPELINE_ORDER.index(new_status)
        if new_idx <= current_idx:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot move status backwards from '{c.status}' to '{new_status}'",
            )
    c.status = new_status
    await db.commit()
    await db.refresh(c)
    return c


async def delete_candidate(
    db: AsyncSession, candidate_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    c = await get_candidate(db, candidate_id, workspace_id)
    await db.delete(c)
    await db.commit()
