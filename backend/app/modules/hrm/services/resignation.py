import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.resignation import Resignation
from app.modules.hrm.schemas.resignation import ResignationCreate, ResignationUpdate


async def create_resignation(
    db: AsyncSession, workspace_id: uuid.UUID, data: ResignationCreate
) -> Resignation:
    r = Resignation(workspace_id=workspace_id, **data.model_dump())
    db.add(r)
    await db.commit()
    await db.refresh(r)
    return r


async def list_resignations(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = None,
    resignation_status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Resignation], int]:
    q = select(Resignation).where(Resignation.workspace_id == workspace_id)
    count_q = select(func.count(Resignation.id)).where(Resignation.workspace_id == workspace_id)

    if employee_id:
        q = q.where(Resignation.employee_id == employee_id)
        count_q = count_q.where(Resignation.employee_id == employee_id)

    if resignation_status:
        q = q.where(Resignation.status == resignation_status)
        count_q = count_q.where(Resignation.status == resignation_status)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Resignation.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_resignation(
    db: AsyncSession, resignation_id: uuid.UUID, workspace_id: uuid.UUID
) -> Resignation:
    result = await db.scalars(
        select(Resignation).where(
            Resignation.id == resignation_id, Resignation.workspace_id == workspace_id
        )
    )
    r = result.first()
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resignation not found")
    return r


async def update_resignation(
    db: AsyncSession, resignation_id: uuid.UUID, workspace_id: uuid.UUID, data: ResignationUpdate
) -> Resignation:
    r = await get_resignation(db, resignation_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(r, field, value)
    await db.commit()
    await db.refresh(r)
    return r


async def approve_resignation(
    db: AsyncSession, resignation_id: uuid.UUID, workspace_id: uuid.UUID, approver_id: uuid.UUID
) -> Resignation:
    r = await get_resignation(db, resignation_id, workspace_id)
    if r.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending resignations can be approved")
    r.status = "approved"
    r.approved_by_id = approver_id
    await db.commit()
    await db.refresh(r)
    return r


async def reject_resignation(
    db: AsyncSession, resignation_id: uuid.UUID, workspace_id: uuid.UUID
) -> Resignation:
    r = await get_resignation(db, resignation_id, workspace_id)
    if r.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending resignations can be rejected")
    r.status = "rejected"
    await db.commit()
    await db.refresh(r)
    return r


async def delete_resignation(
    db: AsyncSession, resignation_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    r = await get_resignation(db, resignation_id, workspace_id)
    await db.delete(r)
    await db.commit()
