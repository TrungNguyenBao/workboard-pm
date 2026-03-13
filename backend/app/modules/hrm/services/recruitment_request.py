import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.recruitment_request import RecruitmentRequest
from app.modules.hrm.schemas.recruitment_request import (
    RecruitmentRequestCreate,
    RecruitmentRequestUpdate,
)
from app.modules.hrm.services.org_tree import get_headcount_summary
from app.modules.hrm.services.status_transitions import validate_transition

RECRUITMENT_TRANSITIONS: dict[str, list[str]] = {
    "draft": ["submitted"],
    "submitted": ["hr_approved", "rejected"],
    "hr_approved": ["ceo_approved", "rejected"],
    "ceo_approved": [],
    "rejected": [],
    "open": ["submitted"],  # legacy compat
}


async def _validate_headcount(
    db: AsyncSession, workspace_id: uuid.UUID, department_id: uuid.UUID, quantity: int
) -> None:
    summary = await get_headcount_summary(db, workspace_id)
    for dept in summary:
        if dept["department_id"] == str(department_id):
            available = dept["open_positions"]
            if quantity > available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Headcount exceeded: {available} open position(s) available, {quantity} requested",
                )
            return
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Position not found in org chart headcount. Configure headcount in Organization settings first.",
    )


async def create_recruitment_request(
    db: AsyncSession, workspace_id: uuid.UUID, data: RecruitmentRequestCreate
) -> RecruitmentRequest:
    rr = RecruitmentRequest(workspace_id=workspace_id, **data.model_dump())
    db.add(rr)
    await db.commit()
    await db.refresh(rr)
    return rr


async def list_recruitment_requests(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    department_id: uuid.UUID | None = None,
    req_status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[RecruitmentRequest], int]:
    q = select(RecruitmentRequest).where(RecruitmentRequest.workspace_id == workspace_id)
    count_q = select(func.count(RecruitmentRequest.id)).where(RecruitmentRequest.workspace_id == workspace_id)

    if department_id:
        q = q.where(RecruitmentRequest.department_id == department_id)
        count_q = count_q.where(RecruitmentRequest.department_id == department_id)
    if req_status:
        q = q.where(RecruitmentRequest.status == req_status)
        count_q = count_q.where(RecruitmentRequest.status == req_status)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(RecruitmentRequest.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_recruitment_request(
    db: AsyncSession, request_id: uuid.UUID, workspace_id: uuid.UUID
) -> RecruitmentRequest:
    result = await db.scalars(
        select(RecruitmentRequest).where(
            RecruitmentRequest.id == request_id, RecruitmentRequest.workspace_id == workspace_id
        )
    )
    rr = result.first()
    if not rr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recruitment request not found")
    return rr


async def update_recruitment_request(
    db: AsyncSession, request_id: uuid.UUID, workspace_id: uuid.UUID, data: RecruitmentRequestUpdate
) -> RecruitmentRequest:
    rr = await get_recruitment_request(db, request_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(rr, field, value)
    await db.commit()
    await db.refresh(rr)
    return rr


async def delete_recruitment_request(
    db: AsyncSession, request_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    rr = await get_recruitment_request(db, request_id, workspace_id)
    await db.delete(rr)
    await db.commit()


async def submit_recruitment_request(
    db: AsyncSession, request_id: uuid.UUID, workspace_id: uuid.UUID, requester_id: uuid.UUID
) -> RecruitmentRequest:
    rr = await get_recruitment_request(db, request_id, workspace_id)
    validate_transition(rr.status, "submitted", RECRUITMENT_TRANSITIONS, "RecruitmentRequest")
    await _validate_headcount(db, workspace_id, rr.department_id, rr.quantity)
    rr.status = "submitted"
    await db.commit()
    await db.refresh(rr)
    return rr


async def approve_recruitment_hr(
    db: AsyncSession, request_id: uuid.UUID, workspace_id: uuid.UUID, reviewer_id: uuid.UUID
) -> RecruitmentRequest:
    rr = await get_recruitment_request(db, request_id, workspace_id)
    validate_transition(rr.status, "hr_approved", RECRUITMENT_TRANSITIONS, "RecruitmentRequest")
    rr.status = "hr_approved"
    await db.commit()
    await db.refresh(rr)
    return rr


async def approve_recruitment_ceo(
    db: AsyncSession, request_id: uuid.UUID, workspace_id: uuid.UUID, reviewer_id: uuid.UUID
) -> RecruitmentRequest:
    rr = await get_recruitment_request(db, request_id, workspace_id)
    validate_transition(rr.status, "ceo_approved", RECRUITMENT_TRANSITIONS, "RecruitmentRequest")
    rr.status = "ceo_approved"
    await db.commit()
    await db.refresh(rr)
    return rr


async def reject_recruitment_request(
    db: AsyncSession, request_id: uuid.UUID, workspace_id: uuid.UUID, reviewer_id: uuid.UUID
) -> RecruitmentRequest:
    rr = await get_recruitment_request(db, request_id, workspace_id)
    validate_transition(rr.status, "rejected", RECRUITMENT_TRANSITIONS, "RecruitmentRequest")
    rr.status = "rejected"
    await db.commit()
    await db.refresh(rr)
    return rr
