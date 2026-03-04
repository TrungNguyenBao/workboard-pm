import uuid
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.contract import Contract
from app.modules.hrm.models.employee import Employee
from app.modules.hrm.models.leave_request import LeaveRequest
from app.modules.hrm.models.leave_type import LeaveType
from app.modules.hrm.models.salary_history import SalaryHistory
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
    db: AsyncSession,
    workspace_id: uuid.UUID,
    department_id: uuid.UUID | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Employee], int]:
    q = select(Employee).where(Employee.workspace_id == workspace_id)
    count_q = select(func.count(Employee.id)).where(Employee.workspace_id == workspace_id)

    if department_id:
        q = q.where(Employee.department_id == department_id)
        count_q = count_q.where(Employee.department_id == department_id)

    if search:
        pattern = f"%{search}%"
        search_filter = Employee.name.ilike(pattern) | Employee.email.ilike(pattern)
        q = q.where(search_filter)
        count_q = count_q.where(search_filter)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Employee.name).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_employee(
    db: AsyncSession, employee_id: uuid.UUID, workspace_id: uuid.UUID
) -> Employee:
    result = await db.scalars(
        select(Employee).where(Employee.id == employee_id, Employee.workspace_id == workspace_id)
    )
    employee = result.first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return employee


async def update_employee(
    db: AsyncSession, employee_id: uuid.UUID, workspace_id: uuid.UUID, data: EmployeeUpdate
) -> Employee:
    employee = await get_employee(db, employee_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(employee, field, value)
    await db.commit()
    await db.refresh(employee)
    return employee


async def delete_employee(
    db: AsyncSession, employee_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    employee = await get_employee(db, employee_id, workspace_id)
    await db.delete(employee)
    await db.commit()


async def get_employee_detail(
    db: AsyncSession, employee_id: uuid.UUID, workspace_id: uuid.UUID
) -> dict:
    employee = await get_employee(db, employee_id, workspace_id)

    # Active contract — most recent by start_date
    contract_result = await db.scalars(
        select(Contract)
        .where(
            Contract.employee_id == employee_id,
            Contract.workspace_id == workspace_id,
            Contract.status == "active",
        )
        .order_by(Contract.start_date.desc())
        .limit(1)
    )
    active_contract = contract_result.first()

    # Last 5 salary history records
    salary_result = await db.scalars(
        select(SalaryHistory)
        .where(
            SalaryHistory.employee_id == employee_id,
            SalaryHistory.workspace_id == workspace_id,
        )
        .order_by(SalaryHistory.effective_date.desc())
        .limit(5)
    )
    recent_salary_changes = list(salary_result.all())

    # Leave balance: all leave types for this workspace
    lt_result = await db.scalars(
        select(LeaveType).where(LeaveType.workspace_id == workspace_id)
    )
    leave_types = list(lt_result.all())

    current_year = date.today().year
    leave_balance: dict = {}

    for lt in leave_types:
        used_result = await db.scalar(
            select(func.coalesce(func.sum(LeaveRequest.days), 0)).where(
                LeaveRequest.employee_id == employee_id,
                LeaveRequest.leave_type_id == lt.id,
                LeaveRequest.status == "approved",
                func.extract("year", LeaveRequest.start_date) == current_year,
            )
        )
        used = int(used_result or 0)
        leave_balance[lt.name] = {
            "total": lt.days_per_year,
            "used": used,
            "remaining": max(0, lt.days_per_year - used),
        }

    return {
        **{c: getattr(employee, c) for c in employee.__table__.columns.keys()},
        "active_contract": active_contract,
        "recent_salary_changes": recent_salary_changes,
        "leave_balance": leave_balance,
    }
