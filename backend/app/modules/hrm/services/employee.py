import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.employee import Employee
from app.modules.hrm.schemas.employee import EmployeeCreate, EmployeeUpdate


async def create_employee(
    db: AsyncSession, workspace_id: uuid.UUID, data: EmployeeCreate
) -> Employee:
    employee = Employee(workspace_id=workspace_id, **data.model_dump())
    db.add(employee)
    await db.commit()
    await db.refresh(employee)
    return employee


async def list_employees(
    db: AsyncSession, workspace_id: uuid.UUID, department_id: uuid.UUID | None = None
) -> list[Employee]:
    q = select(Employee).where(Employee.workspace_id == workspace_id)
    if department_id:
        q = q.where(Employee.department_id == department_id)
    result = await db.scalars(q.order_by(Employee.name))
    return list(result.all())


async def get_employee(db: AsyncSession, employee_id: uuid.UUID) -> Employee:
    employee = await db.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return employee


async def update_employee(
    db: AsyncSession, employee_id: uuid.UUID, data: EmployeeUpdate
) -> Employee:
    employee = await get_employee(db, employee_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(employee, field, value)
    await db.commit()
    await db.refresh(employee)
    return employee


async def delete_employee(db: AsyncSession, employee_id: uuid.UUID) -> None:
    employee = await get_employee(db, employee_id)
    await db.delete(employee)
    await db.commit()
