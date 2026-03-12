import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.pipeline_stage import PipelineStage
from app.modules.crm.schemas.pipeline_stage import PipelineStageCreate, PipelineStageUpdate

DEFAULT_STAGES = [
    {"name": "Lead", "position": 0, "default_probability": 0.0},
    {"name": "Qualified", "position": 1, "default_probability": 0.1},
    {"name": "Needs Analysis", "position": 2, "default_probability": 0.25},
    {"name": "Proposal", "position": 3, "default_probability": 0.5},
    {"name": "Negotiation", "position": 4, "default_probability": 0.75},
    {"name": "Closed Won", "position": 5, "default_probability": 1.0},
    {"name": "Closed Lost", "position": 6, "default_probability": 0.0},
]


async def list_stages(db: AsyncSession, workspace_id: uuid.UUID) -> list[PipelineStage]:
    result = await db.scalars(
        select(PipelineStage)
        .where(PipelineStage.workspace_id == workspace_id)
        .order_by(PipelineStage.position)
    )
    return list(result.all())


async def get_stage(db: AsyncSession, stage_id: uuid.UUID, workspace_id: uuid.UUID) -> PipelineStage:
    result = await db.scalars(
        select(PipelineStage).where(
            PipelineStage.id == stage_id,
            PipelineStage.workspace_id == workspace_id,
        )
    )
    stage = result.first()
    if not stage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pipeline stage not found")
    return stage


async def create_stage(
    db: AsyncSession, workspace_id: uuid.UUID, data: PipelineStageCreate
) -> PipelineStage:
    # Auto-assign position if not specified (append at end)
    position = data.position
    if position == 0:
        existing = await list_stages(db, workspace_id)
        if existing:
            position = existing[-1].position + 1

    stage = PipelineStage(
        workspace_id=workspace_id,
        name=data.name,
        position=position,
        default_probability=data.default_probability,
    )
    db.add(stage)
    await db.commit()
    await db.refresh(stage)
    return stage


async def update_stage(
    db: AsyncSession,
    stage_id: uuid.UUID,
    workspace_id: uuid.UUID,
    data: PipelineStageUpdate,
) -> PipelineStage:
    stage = await get_stage(db, stage_id, workspace_id)
    updates = data.model_dump(exclude_none=True)
    for field, value in updates.items():
        setattr(stage, field, value)
    await db.commit()
    await db.refresh(stage)
    return stage


async def delete_stage(
    db: AsyncSession, stage_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    from app.modules.crm.models.deal import Deal

    stage = await get_stage(db, stage_id, workspace_id)

    # Check if any deals reference this stage by name
    deal_count = await db.scalar(
        select(Deal.id).where(
            Deal.workspace_id == workspace_id,
            Deal.stage == stage.name,
        ).limit(1)
    )
    if deal_count is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete stage with active deals",
        )

    await db.delete(stage)
    await db.commit()


async def reorder_stages(
    db: AsyncSession, workspace_id: uuid.UUID, stage_ids: list[uuid.UUID]
) -> list[PipelineStage]:
    stages = await list_stages(db, workspace_id)
    stage_map = {s.id: s for s in stages}

    for new_position, stage_id in enumerate(stage_ids):
        if stage_id not in stage_map:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stage {stage_id} not found in workspace",
            )
        stage_map[stage_id].position = new_position

    await db.commit()
    return await list_stages(db, workspace_id)


async def seed_default_stages(
    db: AsyncSession, workspace_id: uuid.UUID
) -> list[PipelineStage]:
    # Only seed if workspace has no stages
    existing = await list_stages(db, workspace_id)
    if existing:
        return existing

    stages = [
        PipelineStage(workspace_id=workspace_id, **s)
        for s in DEFAULT_STAGES
    ]
    db.add_all(stages)
    await db.commit()
    for s in stages:
        await db.refresh(s)
    return stages
