import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.exit_interview import ExitInterview
from app.modules.hrm.schemas.exit_interview import ExitInterviewCreate, ExitInterviewUpdate


async def create_exit_interview(
    db: AsyncSession, workspace_id: uuid.UUID, data: ExitInterviewCreate
) -> ExitInterview:
    ei = ExitInterview(workspace_id=workspace_id, **data.model_dump())
    db.add(ei)
    await db.commit()
    await db.refresh(ei)
    return ei


async def get_exit_interview_by_resignation(
    db: AsyncSession, resignation_id: uuid.UUID, workspace_id: uuid.UUID
) -> ExitInterview:
    result = await db.scalars(
        select(ExitInterview).where(
            ExitInterview.resignation_id == resignation_id,
            ExitInterview.workspace_id == workspace_id,
        )
    )
    ei = result.first()
    if not ei:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exit interview not found")
    return ei


async def get_exit_interview(
    db: AsyncSession, exit_interview_id: uuid.UUID, workspace_id: uuid.UUID
) -> ExitInterview:
    result = await db.scalars(
        select(ExitInterview).where(
            ExitInterview.id == exit_interview_id,
            ExitInterview.workspace_id == workspace_id,
        )
    )
    ei = result.first()
    if not ei:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exit interview not found")
    return ei


async def update_exit_interview(
    db: AsyncSession, exit_interview_id: uuid.UUID, workspace_id: uuid.UUID, data: ExitInterviewUpdate
) -> ExitInterview:
    ei = await get_exit_interview(db, exit_interview_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(ei, field, value)
    await db.commit()
    await db.refresh(ei)
    return ei
