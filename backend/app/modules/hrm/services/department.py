import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
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


async def list_departments(db: AsyncSession, workspace_id: uuid.UUID) -> list[Department]:
    result = await db.scalars(
        select(Department).where(Department.workspace_id == workspace_id).order_by(Department.name)
    )
    return list(result.all())


async def get_department(db: AsyncSession, department_id: uuid.UUID) -> Department:
    dept = await db.get(Department, department_id)
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
    return dept


async def update_department(
    db: AsyncSession, department_id: uuid.UUID, data: DepartmentUpdate
) -> Department:
    dept = await get_department(db, department_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(dept, field, value)
    await db.commit()
    await db.refresh(dept)
    return dept


async def delete_department(db: AsyncSession, department_id: uuid.UUID) -> None:
    dept = await get_department(db, department_id)
    await db.delete(dept)
    await db.commit()
