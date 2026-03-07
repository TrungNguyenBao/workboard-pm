import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.activity import Activity
from app.modules.crm.schemas.activity import ActivityCreate, ActivityUpdate


async def create_activity(db: AsyncSession, workspace_id: uuid.UUID, data: ActivityCreate) -> Activity:
    activity = Activity(workspace_id=workspace_id, **data.model_dump())
    db.add(activity)

    # Auto-update deal.last_activity_date (SOP 05)
    if activity.deal_id:
        from app.modules.crm.models.deal import Deal
        deal = await db.get(Deal, activity.deal_id)
        if deal and deal.workspace_id == workspace_id:
            deal.last_activity_date = activity.date

    # Auto-update lead.contacted_at on first activity (SOP 02)
    if activity.lead_id:
        from app.modules.crm.models.lead import Lead
        lead = await db.get(Lead, activity.lead_id)
        if lead and lead.workspace_id == workspace_id and not lead.contacted_at:
            lead.contacted_at = activity.date

    await db.commit()
    await db.refresh(activity)
    return activity


async def list_activities(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    type_filter: str | None = None,
    contact_id: uuid.UUID | None = None,
    deal_id: uuid.UUID | None = None,
    lead_id: uuid.UUID | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Activity], int]:
    q = select(Activity).where(Activity.workspace_id == workspace_id)
    count_q = select(func.count(Activity.id)).where(Activity.workspace_id == workspace_id)

    if type_filter:
        q = q.where(Activity.type == type_filter)
        count_q = count_q.where(Activity.type == type_filter)
    if contact_id:
        q = q.where(Activity.contact_id == contact_id)
        count_q = count_q.where(Activity.contact_id == contact_id)
    if deal_id:
        q = q.where(Activity.deal_id == deal_id)
        count_q = count_q.where(Activity.deal_id == deal_id)
    if lead_id:
        q = q.where(Activity.lead_id == lead_id)
        count_q = count_q.where(Activity.lead_id == lead_id)
    if search:
        pattern = f"%{search}%"
        q = q.where(Activity.subject.ilike(pattern))
        count_q = count_q.where(Activity.subject.ilike(pattern))

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Activity.date.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_activity(db: AsyncSession, activity_id: uuid.UUID, workspace_id: uuid.UUID) -> Activity:
    result = await db.scalars(
        select(Activity).where(Activity.id == activity_id, Activity.workspace_id == workspace_id)
    )
    activity = result.first()
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    return activity


async def update_activity(
    db: AsyncSession, activity_id: uuid.UUID, workspace_id: uuid.UUID, data: ActivityUpdate
) -> Activity:
    activity = await get_activity(db, activity_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(activity, field, value)
    await db.commit()
    await db.refresh(activity)
    return activity


async def delete_activity(db: AsyncSession, activity_id: uuid.UUID, workspace_id: uuid.UUID) -> None:
    activity = await get_activity(db, activity_id, workspace_id)
    await db.delete(activity)
    await db.commit()
