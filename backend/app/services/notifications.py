import asyncio
import json
import uuid
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.pms.models.notification import Notification

# In-process SSE broker: workspace_id → set of queues
_broker: dict[str, set[asyncio.Queue]] = defaultdict(set)


def _workspace_key(workspace_id: uuid.UUID) -> str:
    return str(workspace_id)


async def subscribe(workspace_id: uuid.UUID) -> tuple[asyncio.Queue, "callable"]:
    q: asyncio.Queue = asyncio.Queue(maxsize=100)
    key = _workspace_key(workspace_id)
    _broker[key].add(q)

    def unsubscribe():
        _broker[key].discard(q)

    return q, unsubscribe


async def publish(workspace_id: uuid.UUID, event: dict) -> None:
    key = _workspace_key(workspace_id)
    payload = json.dumps(event)
    for q in list(_broker.get(key, set())):
        try:
            q.put_nowait(payload)
        except asyncio.QueueFull:
            pass  # drop for slow consumers


async def create_notification(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    actor_id: uuid.UUID | None,
    type: str,
    title: str,
    body: str | None = None,
    resource_type: str | None = None,
    resource_id: uuid.UUID | None = None,
    workspace_id: uuid.UUID | None = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        actor_id=actor_id,
        type=type,
        title=title,
        body=body,
        resource_type=resource_type,
        resource_id=resource_id,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)

    if workspace_id:
        await publish(workspace_id, {
            "type": "notification",
            "notification_id": str(notif.id),
            "user_id": str(user_id),
            "notif_type": type,
            "title": title,
        })
    return notif


async def list_notifications(
    db: AsyncSession, user_id: uuid.UUID, unread_only: bool = False
) -> list[Notification]:
    q = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        q = q.where(Notification.is_read.is_(False))
    q = q.order_by(Notification.created_at.desc()).limit(50)
    result = await db.scalars(q)
    return list(result.all())


async def mark_read(db: AsyncSession, notification_id: uuid.UUID, user_id: uuid.UUID) -> None:
    notif = await db.get(Notification, notification_id)
    if notif and notif.user_id == user_id:
        notif.is_read = True
        await db.commit()


async def mark_all_read(db: AsyncSession, user_id: uuid.UUID) -> None:
    result = await db.scalars(
        select(Notification).where(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
        )
    )
    for notif in result.all():
        notif.is_read = True
    await db.commit()
