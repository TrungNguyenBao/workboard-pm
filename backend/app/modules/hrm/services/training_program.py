import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.training_program import TrainingProgram
from app.modules.hrm.schemas.training_program import TrainingProgramCreate, TrainingProgramUpdate


async def create_training_program(
    db: AsyncSession, workspace_id: uuid.UUID, data: TrainingProgramCreate
) -> TrainingProgram:
    program = TrainingProgram(workspace_id=workspace_id, **data.model_dump())
    db.add(program)
    await db.commit()
    await db.refresh(program)
    return program


async def list_training_programs(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    status_filter: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[TrainingProgram], int]:
    q = select(TrainingProgram).where(TrainingProgram.workspace_id == workspace_id)
    count_q = select(func.count(TrainingProgram.id)).where(TrainingProgram.workspace_id == workspace_id)

    if status_filter:
        q = q.where(TrainingProgram.status == status_filter)
        count_q = count_q.where(TrainingProgram.status == status_filter)

    if search:
        like = f"%{search}%"
        q = q.where(TrainingProgram.name.ilike(like))
        count_q = count_q.where(TrainingProgram.name.ilike(like))

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(TrainingProgram.name).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_training_program(
    db: AsyncSession, program_id: uuid.UUID, workspace_id: uuid.UUID
) -> TrainingProgram:
    result = await db.scalars(
        select(TrainingProgram).where(
            TrainingProgram.id == program_id,
            TrainingProgram.workspace_id == workspace_id,
        )
    )
    program = result.first()
    if not program:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Training program not found")
    return program


async def update_training_program(
    db: AsyncSession, program_id: uuid.UUID, workspace_id: uuid.UUID, data: TrainingProgramUpdate
) -> TrainingProgram:
    program = await get_training_program(db, program_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(program, field, value)
    await db.commit()
    await db.refresh(program)
    return program


async def delete_training_program(
    db: AsyncSession, program_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    program = await get_training_program(db, program_id, workspace_id)
    await db.delete(program)
    await db.commit()
