import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.asset_assignment import AssetAssignment
from app.modules.hrm.schemas.asset_assignment import AssetAssignmentCreate, AssetAssignmentUpdate
from app.modules.hrm.services.asset import set_asset_status


async def create_assignment(
    db: AsyncSession, workspace_id: uuid.UUID, data: AssetAssignmentCreate
) -> AssetAssignment:
    assignment = AssetAssignment(workspace_id=workspace_id, **data.model_dump())
    db.add(assignment)
    # Mark asset as assigned in same transaction
    await set_asset_status(db, data.asset_id, workspace_id, "assigned")
    await db.commit()
    await db.refresh(assignment)
    return assignment


async def list_assignments(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    asset_id: uuid.UUID | None = None,
    employee_id: uuid.UUID | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[AssetAssignment], int]:
    q = select(AssetAssignment).where(AssetAssignment.workspace_id == workspace_id)
    count_q = select(func.count(AssetAssignment.id)).where(AssetAssignment.workspace_id == workspace_id)

    if asset_id:
        q = q.where(AssetAssignment.asset_id == asset_id)
        count_q = count_q.where(AssetAssignment.asset_id == asset_id)
    if employee_id:
        q = q.where(AssetAssignment.employee_id == employee_id)
        count_q = count_q.where(AssetAssignment.employee_id == employee_id)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(AssetAssignment.assigned_date.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_assignment(
    db: AsyncSession, assignment_id: uuid.UUID, workspace_id: uuid.UUID
) -> AssetAssignment:
    result = await db.scalars(
        select(AssetAssignment).where(
            AssetAssignment.id == assignment_id,
            AssetAssignment.workspace_id == workspace_id,
        )
    )
    assignment = result.first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    return assignment


async def update_assignment(
    db: AsyncSession,
    assignment_id: uuid.UUID,
    workspace_id: uuid.UUID,
    data: AssetAssignmentUpdate,
) -> AssetAssignment:
    assignment = await get_assignment(db, assignment_id, workspace_id)
    update_data = data.model_dump(exclude_none=True)

    for field, value in update_data.items():
        setattr(assignment, field, value)

    # If returned_date is being set, free the asset
    if "returned_date" in update_data and update_data["returned_date"] is not None:
        await set_asset_status(db, assignment.asset_id, workspace_id, "available")

    await db.commit()
    await db.refresh(assignment)
    return assignment


async def delete_assignment(
    db: AsyncSession, assignment_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    assignment = await get_assignment(db, assignment_id, workspace_id)
    await db.delete(assignment)
    await db.commit()
