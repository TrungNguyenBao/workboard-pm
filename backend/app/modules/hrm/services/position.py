import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.position import Position
from app.modules.hrm.schemas.position import PositionCreate, PositionUpdate


async def create_position(
    db: AsyncSession, workspace_id: uuid.UUID, data: PositionCreate
) -> Position:
    pos = Position(workspace_id=workspace_id, **data.model_dump())
    db.add(pos)
    await db.commit()
    await db.refresh(pos)
    return pos


async def list_positions(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    department_id: uuid.UUID | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Position], int]:
    q = select(Position).where(Position.workspace_id == workspace_id)
    count_q = select(func.count(Position.id)).where(Position.workspace_id == workspace_id)

    if department_id:
        q = q.where(Position.department_id == department_id)
        count_q = count_q.where(Position.department_id == department_id)

    if search:
        pattern = f"%{search}%"
        q = q.where(Position.title.ilike(pattern))
        count_q = count_q.where(Position.title.ilike(pattern))

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Position.title).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_position(
    db: AsyncSession, position_id: uuid.UUID, workspace_id: uuid.UUID
) -> Position:
    result = await db.scalars(
        select(Position).where(
            Position.id == position_id, Position.workspace_id == workspace_id
        )
    )
    pos = result.first()
    if not pos:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Position not found")
    return pos


async def update_position(
    db: AsyncSession, position_id: uuid.UUID, workspace_id: uuid.UUID, data: PositionUpdate
) -> Position:
    pos = await get_position(db, position_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(pos, field, value)
    await db.commit()
    await db.refresh(pos)
    return pos


async def delete_position(
    db: AsyncSession, position_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    pos = await get_position(db, position_id, workspace_id)
    await db.delete(pos)
    await db.commit()
