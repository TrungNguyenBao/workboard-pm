import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.recruitment_request import RecruitmentRequest
from app.modules.hrm.schemas.recruitment_request import RecruitmentRequestCreate, RecruitmentRequestUpdate


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
