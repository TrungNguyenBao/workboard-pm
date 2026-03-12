import uuid
from collections import deque

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.modules.pms.models.project import Project
from app.modules.pms.models.task import Task, TaskDependency
from app.modules.pms.schemas.dependency import DependencyCreate, DependencyResponse
from app.modules.pms.services.activity_log import create_activity


def _to_response(dep: TaskDependency) -> DependencyResponse:
    return DependencyResponse(
        id=dep.id,
        blocking_task_id=dep.blocking_task_id,
        blocked_task_id=dep.blocked_task_id,
        dependency_type=getattr(dep, "dependency_type", "blocks"),
        blocking_task_title=dep.blocking_task.title,
        blocked_task_title=dep.blocked_task.title,
    )


async def _load_deps(db: AsyncSession, task_id: uuid.UUID) -> list[TaskDependency]:
    result = await db.scalars(
        select(TaskDependency)
        .options(
            selectinload(TaskDependency.blocking_task),
            selectinload(TaskDependency.blocked_task),
        )
        .where(
            or_(
                TaskDependency.blocking_task_id == task_id,
                TaskDependency.blocked_task_id == task_id,
            )
        )
    )
    return list(result.all())


async def list_dependencies(db: AsyncSession, task_id: uuid.UUID) -> list[DependencyResponse]:
    deps = await _load_deps(db, task_id)
    return [_to_response(d) for d in deps]


async def _has_path(db: AsyncSession, start: uuid.UUID, target: uuid.UUID) -> bool:
    """BFS: check if target is reachable from start following blocking edges."""
    visited: set[uuid.UUID] = set()
    queue: deque[uuid.UUID] = deque([start])
    while queue:
        current = queue.popleft()
        if current == target:
            return True
        if current in visited:
            continue
        visited.add(current)
        rows = await db.scalars(
            select(TaskDependency.blocked_task_id).where(
                TaskDependency.blocking_task_id == current
            )
        )
        for next_id in rows.all():
            if next_id not in visited:
                queue.append(next_id)
    return False


async def create_dependency(
    db: AsyncSession,
    task_id: uuid.UUID,
    data: DependencyCreate,
    actor: User,
) -> DependencyResponse:
    blocking_id = data.blocking_task_id
    blocked_id = task_id

    if blocking_id == blocked_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Task cannot depend on itself")

    # Circular check: if blocked_id can already reach blocking_id, adding this edge would create a cycle
    if await _has_path(db, blocked_id, blocking_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Circular dependency detected")

    blocking_task = await db.get(Task, blocking_id)
    if not blocking_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blocking task not found")

    dep = TaskDependency(blocking_task_id=blocking_id, blocked_task_id=blocked_id)
    db.add(dep)
    await db.flush()

    # Load relationships for response
    await db.refresh(dep, ["blocking_task", "blocked_task"])

    project_row = await db.scalar(select(Project.workspace_id).where(Project.id == blocking_task.project_id))
    if project_row:
        await create_activity(
            db,
            workspace_id=project_row,
            project_id=blocking_task.project_id,
            entity_type="task",
            entity_id=blocked_id,
            actor_id=actor.id,
            action="dependency_added",
            changes={"blocking_task_id": str(blocking_id)},
        )
    else:
        await db.commit()

    return _to_response(dep)


async def delete_dependency(db: AsyncSession, dependency_id: uuid.UUID) -> None:
    dep = await db.get(TaskDependency, dependency_id)
    if not dep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dependency not found")
    await db.delete(dep)
    await db.commit()
