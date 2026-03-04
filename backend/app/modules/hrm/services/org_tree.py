import uuid
from collections import defaultdict

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.department import Department
from app.modules.hrm.models.employee import Employee
from app.modules.hrm.models.position import Position
from app.modules.hrm.schemas.department import DepartmentTreeNode


async def get_org_tree(
    db: AsyncSession, workspace_id: uuid.UUID
) -> list[DepartmentTreeNode]:
    # Fetch all departments with manager info
    dept_q = select(Department).where(Department.workspace_id == workspace_id)
    dept_result = await db.scalars(dept_q)
    departments = list(dept_result.all())

    # Collect manager IDs and fetch manager names in one query
    manager_ids = [d.manager_id for d in departments if d.manager_id]
    manager_map: dict[uuid.UUID, str] = {}
    if manager_ids:
        emp_result = await db.scalars(
            select(Employee).where(Employee.id.in_(manager_ids))
        )
        for emp in emp_result.all():
            manager_map[emp.id] = emp.name

    # Count employees per department
    count_q = (
        select(Employee.department_id, func.count(Employee.id).label("cnt"))
        .where(Employee.workspace_id == workspace_id, Employee.department_id.isnot(None))
        .group_by(Employee.department_id)
    )
    count_result = await db.execute(count_q)
    emp_count: dict[uuid.UUID, int] = {row[0]: row[1] for row in count_result.all()}

    # Build node map
    nodes: dict[uuid.UUID, DepartmentTreeNode] = {}
    for d in departments:
        nodes[d.id] = DepartmentTreeNode(
            id=d.id,
            name=d.name,
            description=d.description,
            parent_department_id=d.parent_department_id,
            manager_id=d.manager_id,
            manager_name=manager_map.get(d.manager_id) if d.manager_id else None,
            employee_count=emp_count.get(d.id, 0),
        )

    # Attach children and collect roots
    roots: list[DepartmentTreeNode] = []
    for node in nodes.values():
        if node.parent_department_id and node.parent_department_id in nodes:
            nodes[node.parent_department_id].children.append(node)
        else:
            roots.append(node)

    return roots


async def get_headcount_summary(
    db: AsyncSession, workspace_id: uuid.UUID
) -> list[dict]:
    # Fetch departments
    dept_result = await db.scalars(
        select(Department).where(Department.workspace_id == workspace_id)
    )
    departments = list(dept_result.all())

    # Total positions per department
    pos_q = (
        select(Position.department_id, func.count(Position.id).label("total"))
        .where(Position.workspace_id == workspace_id)
        .group_by(Position.department_id)
    )
    pos_result = await db.execute(pos_q)
    total_positions: dict[uuid.UUID, int] = {row[0]: row[1] for row in pos_result.all()}

    # Filled count = employees assigned to department
    emp_q = (
        select(Employee.department_id, func.count(Employee.id).label("filled"))
        .where(Employee.workspace_id == workspace_id, Employee.department_id.isnot(None))
        .group_by(Employee.department_id)
    )
    emp_result = await db.execute(emp_q)
    filled_map: dict[uuid.UUID, int] = {row[0]: row[1] for row in emp_result.all()}

    summary = []
    for d in departments:
        total = total_positions.get(d.id, 0)
        filled = filled_map.get(d.id, 0)
        summary.append({
            "department_id": str(d.id),
            "department_name": d.name,
            "total_positions": total,
            "filled_count": filled,
            "open_positions": max(0, total - filled),
        })

    return summary
