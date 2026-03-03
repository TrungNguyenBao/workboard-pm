import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.leave_type import LeaveType
from app.modules.hrm.schemas.leave_type import LeaveTypeCreate, LeaveTypeUpdate


async def create_leave_type(
    db: AsyncSession, workspace_id: uuid.UUID, data: LeaveTypeCreate
) -> LeaveType:
    lt = LeaveType(workspace_id=workspace_id, **data.model_dump())
    db.add(lt)
    await db.commit()
    await db.refresh(lt)
    return lt


async def list_leave_types(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[LeaveType], int]:
    q = select(LeaveType).where(LeaveType.workspace_id == workspace_id)
    count_q = select(func.count(LeaveType.id)).where(LeaveType.workspace_id == workspace_id)

    if search:
        pattern = f"%{search}%"
        q = q.where(LeaveType.name.ilike(pattern))
        count_q = count_q.where(LeaveType.name.ilike(pattern))

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(LeaveType.name).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_leave_type(
    db: AsyncSession, leave_type_id: uuid.UUID, workspace_id: uuid.UUID
) -> LeaveType:
    result = await db.scalars(
        select(LeaveType).where(LeaveType.id == leave_type_id, LeaveType.workspace_id == workspace_id)
    )
    lt = result.first()
    if not lt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave type not found")
    return lt


async def update_leave_type(
    db: AsyncSession, leave_type_id: uuid.UUID, workspace_id: uuid.UUID, data: LeaveTypeUpdate
) -> LeaveType:
    lt = await get_leave_type(db, leave_type_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(lt, field, value)
    await db.commit()
    await db.refresh(lt)
    return lt


async def delete_leave_type(
    db: AsyncSession, leave_type_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    lt = await get_leave_type(db, leave_type_id, workspace_id)
    await db.delete(lt)
    await db.commit()
