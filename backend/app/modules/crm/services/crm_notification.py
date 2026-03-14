import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.crm_notification import CrmNotification


async def create_notification(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    recipient_id: uuid.UUID,
    type: str,
    title: str,
    body: str | None = None,
    entity_type: str | None = None,
    entity_id: uuid.UUID | None = None,
    channel: str = "in_app",
) -> CrmNotification:
    item = CrmNotification(
        workspace_id=workspace_id,
        recipient_id=recipient_id,
        type=type,
        title=title,
        body=body,
        entity_type=entity_type,
        entity_id=entity_id,
        channel=channel,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def list_notifications(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    recipient_id: uuid.UUID,
    is_read: bool | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[CrmNotification], int]:
    q = select(CrmNotification).where(
        CrmNotification.workspace_id == workspace_id,
        CrmNotification.recipient_id == recipient_id,
    )
    count_q = select(func.count(CrmNotification.id)).where(
        CrmNotification.workspace_id == workspace_id,
        CrmNotification.recipient_id == recipient_id,
    )
    if is_read is not None:
        q = q.where(CrmNotification.is_read == is_read)
        count_q = count_q.where(CrmNotification.is_read == is_read)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(CrmNotification.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_unread_count(
    db: AsyncSession, workspace_id: uuid.UUID, recipient_id: uuid.UUID
) -> int:
    count = await db.scalar(
        select(func.count(CrmNotification.id)).where(
            CrmNotification.workspace_id == workspace_id,
            CrmNotification.recipient_id == recipient_id,
            CrmNotification.is_read == False,  # noqa: E712
        )
    )
    return count or 0


async def mark_read(
    db: AsyncSession, notification_id: uuid.UUID, workspace_id: uuid.UUID, recipient_id: uuid.UUID
) -> CrmNotification:
    result = await db.scalars(
        select(CrmNotification).where(
            CrmNotification.id == notification_id,
            CrmNotification.workspace_id == workspace_id,
            CrmNotification.recipient_id == recipient_id,
        )
    )
    item = result.first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    item.is_read = True
    await db.commit()
    await db.refresh(item)
    return item


async def mark_all_read(
    db: AsyncSession, workspace_id: uuid.UUID, recipient_id: uuid.UUID
) -> None:
    await db.execute(
        update(CrmNotification)
        .where(
            CrmNotification.workspace_id == workspace_id,
            CrmNotification.recipient_id == recipient_id,
            CrmNotification.is_read == False,  # noqa: E712
        )
        .values(is_read=True)
    )
    await db.commit()
