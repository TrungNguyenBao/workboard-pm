import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.activity_log import ActivityLog
from app.services.notifications import publish


async def create_activity(
    db: AsyncSession,
    *,
    workspace_id: uuid.UUID,
    project_id: uuid.UUID | None,
    entity_type: str,
    entity_id: uuid.UUID,
    actor_id: uuid.UUID,
    action: str,
    changes: dict | None = None,
) -> ActivityLog:
    entry = ActivityLog(
        workspace_id=workspace_id,
        project_id=project_id,
        entity_type=entity_type,
        entity_id=entity_id,
        actor_id=actor_id,
        action=action,
        changes=changes,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    await publish(workspace_id, {
        "type": "activity_created",
        "project_id": str(project_id) if project_id else None,
        "entity_type": entity_type,
        "entity_id": str(entity_id),
    })

    return entry


async def list_activity(
    db: AsyncSession,
    *,
    project_id: uuid.UUID | None = None,
    entity_type: str | None = None,
    entity_id: uuid.UUID | None = None,
    limit: int = 50,
    cursor: str | None = None,
) -> list[ActivityLog]:
    q = select(ActivityLog).options(selectinload(ActivityLog.actor))

    if project_id:
        q = q.where(ActivityLog.project_id == project_id)
    if entity_type:
        q = q.where(ActivityLog.entity_type == entity_type)
    if entity_id:
        q = q.where(ActivityLog.entity_id == entity_id)
    if cursor:
        cursor_id = uuid.UUID(cursor)
        cursor_entry = await db.get(ActivityLog, cursor_id)
        if cursor_entry:
            q = q.where(ActivityLog.created_at < cursor_entry.created_at)

    q = q.order_by(ActivityLog.created_at.desc()).limit(limit)
    result = await db.scalars(q)
    return list(result.all())
