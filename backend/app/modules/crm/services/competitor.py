import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.competitor import Competitor
from app.modules.crm.schemas.competitor import CompetitorCreate, CompetitorUpdate


async def create_competitor(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    deal_id: uuid.UUID,
    data: CompetitorCreate,
) -> Competitor:
    competitor = Competitor(workspace_id=workspace_id, deal_id=deal_id, **data.model_dump())
    db.add(competitor)
    await db.commit()
    await db.refresh(competitor)
    return competitor


async def list_competitors(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    deal_id: uuid.UUID,
) -> list[Competitor]:
    result = await db.scalars(
        select(Competitor)
        .where(Competitor.workspace_id == workspace_id, Competitor.deal_id == deal_id)
        .order_by(Competitor.name)
    )
    return list(result.all())


async def get_competitor(
    db: AsyncSession,
    competitor_id: uuid.UUID,
    deal_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> Competitor:
    result = await db.scalars(
        select(Competitor).where(
            Competitor.id == competitor_id,
            Competitor.deal_id == deal_id,
            Competitor.workspace_id == workspace_id,
        )
    )
    competitor = result.first()
    if not competitor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competitor not found")
    return competitor


async def update_competitor(
    db: AsyncSession,
    competitor_id: uuid.UUID,
    deal_id: uuid.UUID,
    workspace_id: uuid.UUID,
    data: CompetitorUpdate,
) -> Competitor:
    competitor = await get_competitor(db, competitor_id, deal_id, workspace_id)
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(competitor, key, value)
    await db.commit()
    await db.refresh(competitor)
    return competitor


async def delete_competitor(
    db: AsyncSession,
    competitor_id: uuid.UUID,
    deal_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> None:
    competitor = await get_competitor(db, competitor_id, deal_id, workspace_id)
    await db.delete(competitor)
    await db.commit()
