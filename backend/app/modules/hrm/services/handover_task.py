import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.handover_task import HandoverTask
from app.modules.hrm.schemas.handover_task import HandoverTaskCreate, HandoverTaskUpdate


async def create_handover_task(
    db: AsyncSession, workspace_id: uuid.UUID, data: HandoverTaskCreate
) -> HandoverTask:
    t = HandoverTask(workspace_id=workspace_id, **data.model_dump())
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return t


async def list_handover_tasks(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    resignation_id: uuid.UUID | None = None,
    task_status: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[HandoverTask], int]:
    q = select(HandoverTask).where(HandoverTask.workspace_id == workspace_id)
    count_q = select(func.count(HandoverTask.id)).where(HandoverTask.workspace_id == workspace_id)

    if resignation_id:
        q = q.where(HandoverTask.resignation_id == resignation_id)
        count_q = count_q.where(HandoverTask.resignation_id == resignation_id)

    if task_status:
        q = q.where(HandoverTask.status == task_status)
        count_q = count_q.where(HandoverTask.status == task_status)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(HandoverTask.created_at.asc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_handover_task(
    db: AsyncSession, task_id: uuid.UUID, workspace_id: uuid.UUID
) -> HandoverTask:
    result = await db.scalars(
        select(HandoverTask).where(
            HandoverTask.id == task_id, HandoverTask.workspace_id == workspace_id
        )
    )
    t = result.first()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Handover task not found")
    return t


async def update_handover_task(
    db: AsyncSession, task_id: uuid.UUID, workspace_id: uuid.UUID, data: HandoverTaskUpdate
) -> HandoverTask:
    t = await get_handover_task(db, task_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(t, field, value)
    await db.commit()
    await db.refresh(t)
    return t


async def delete_handover_task(
    db: AsyncSession, task_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    t = await get_handover_task(db, task_id, workspace_id)
    await db.delete(t)
    await db.commit()
