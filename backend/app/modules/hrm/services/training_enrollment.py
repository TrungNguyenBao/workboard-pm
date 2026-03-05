import uuid
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.training_enrollment import TrainingEnrollment
from app.modules.hrm.schemas.training_enrollment import TrainingEnrollmentCreate, TrainingEnrollmentUpdate


async def create_training_enrollment(
    db: AsyncSession, workspace_id: uuid.UUID, data: TrainingEnrollmentCreate
) -> TrainingEnrollment:
    enrollment = TrainingEnrollment(workspace_id=workspace_id, **data.model_dump())
    db.add(enrollment)
    try:
        await db.commit()
        await db.refresh(enrollment)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Employee is already enrolled in this program",
        )
    return enrollment


async def list_training_enrollments(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    program_id: uuid.UUID | None = None,
    employee_id: uuid.UUID | None = None,
    status_filter: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[TrainingEnrollment], int]:
    q = select(TrainingEnrollment).where(TrainingEnrollment.workspace_id == workspace_id)
    count_q = select(func.count(TrainingEnrollment.id)).where(TrainingEnrollment.workspace_id == workspace_id)

    if program_id:
        q = q.where(TrainingEnrollment.program_id == program_id)
        count_q = count_q.where(TrainingEnrollment.program_id == program_id)
    if employee_id:
        q = q.where(TrainingEnrollment.employee_id == employee_id)
        count_q = count_q.where(TrainingEnrollment.employee_id == employee_id)
    if status_filter:
        q = q.where(TrainingEnrollment.status == status_filter)
        count_q = count_q.where(TrainingEnrollment.status == status_filter)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(TrainingEnrollment.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_training_enrollment(
    db: AsyncSession, enrollment_id: uuid.UUID, workspace_id: uuid.UUID
) -> TrainingEnrollment:
    result = await db.scalars(
        select(TrainingEnrollment).where(
            TrainingEnrollment.id == enrollment_id,
            TrainingEnrollment.workspace_id == workspace_id,
        )
    )
    enrollment = result.first()
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
    return enrollment


async def update_training_enrollment(
    db: AsyncSession, enrollment_id: uuid.UUID, workspace_id: uuid.UUID, data: TrainingEnrollmentUpdate
) -> TrainingEnrollment:
    enrollment = await get_training_enrollment(db, enrollment_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(enrollment, field, value)
    await db.commit()
    await db.refresh(enrollment)
    return enrollment


async def complete_enrollment(
    db: AsyncSession,
    enrollment_id: uuid.UUID,
    workspace_id: uuid.UUID,
    score: float | None = None,
    feedback: str | None = None,
) -> TrainingEnrollment:
    enrollment = await get_training_enrollment(db, enrollment_id, workspace_id)
    enrollment.status = "completed"
    enrollment.completion_date = date.today()
    if score is not None:
        enrollment.score = score
    if feedback is not None:
        enrollment.feedback = feedback
    await db.commit()
    await db.refresh(enrollment)
    return enrollment


async def delete_training_enrollment(
    db: AsyncSession, enrollment_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    enrollment = await get_training_enrollment(db, enrollment_id, workspace_id)
    await db.delete(enrollment)
    await db.commit()
