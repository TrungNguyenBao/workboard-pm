import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.department import Department
from app.modules.hrm.schemas.department import DepartmentCreate, DepartmentUpdate


async def create_department(
    db: AsyncSession, workspace_id: uuid.UUID, data: DepartmentCreate
) -> Department:
    dept = Department(workspace_id=workspace_id, **data.model_dump())
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return dept


async def list_departments(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Department], int]:
    q = select(Department).where(Department.workspace_id == workspace_id)
    count_q = select(func.count(Department.id)).where(Department.workspace_id == workspace_id)

    if search:
        pattern = f"%{search}%"
        search_filter = Department.name.ilike(pattern)
        q = q.where(search_filter)
        count_q = count_q.where(search_filter)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Department.name).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_department(
    db: AsyncSession, department_id: uuid.UUID, workspace_id: uuid.UUID
) -> Department:
    result = await db.scalars(
        select(Department).where(Department.id == department_id, Department.workspace_id == workspace_id)
    )
    dept = result.first()
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
    return dept


async def update_department(
    db: AsyncSession, department_id: uuid.UUID, workspace_id: uuid.UUID, data: DepartmentUpdate
) -> Department:
    dept = await get_department(db, department_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(dept, field, value)
    await db.commit()
    await db.refresh(dept)
    return dept


async def delete_department(
    db: AsyncSession, department_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    dept = await get_department(db, department_id, workspace_id)
    await db.delete(dept)
    await db.commit()
