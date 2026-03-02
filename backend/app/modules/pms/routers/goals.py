import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.pms.schemas.goal import (
    GoalCreate,
    GoalResponse,
    GoalUpdate,
    LinkProjectRequest,
    LinkTaskRequest,
)
from app.modules.pms.services.goal import (
    _verify_goal_workspace,
    create_goal,
    delete_goal,
    get_goal,
    link_project,
    link_task,
    list_goals,
    unlink_project,
    unlink_task,
    update_goal,
)

router = APIRouter(prefix="/workspaces/{workspace_id}/goals", tags=["goals"])


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create(
    workspace_id: uuid.UUID,
    data: GoalCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    goal = await create_goal(db, workspace_id, data)
    return GoalResponse.from_orm_with_counts(goal)


@router.get("", response_model=list[GoalResponse])
async def list_(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    goals = await list_goals(db, workspace_id)
    return [GoalResponse.from_orm_with_counts(g) for g in goals]


@router.get("/{goal_id}", response_model=GoalResponse)
async def get(
    workspace_id: uuid.UUID,
    goal_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    goal = await get_goal(db, goal_id)
    await _verify_goal_workspace(goal, workspace_id)
    return GoalResponse.from_orm_with_counts(goal)


@router.patch("/{goal_id}", response_model=GoalResponse)
async def update(
    workspace_id: uuid.UUID,
    goal_id: uuid.UUID,
    data: GoalUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    goal = await get_goal(db, goal_id)
    await _verify_goal_workspace(goal, workspace_id)
    goal = await update_goal(db, goal_id, data)
    return GoalResponse.from_orm_with_counts(goal)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    workspace_id: uuid.UUID,
    goal_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    goal = await get_goal(db, goal_id)
    await _verify_goal_workspace(goal, workspace_id)
    await delete_goal(db, goal_id)


@router.post("/{goal_id}/projects", status_code=status.HTTP_204_NO_CONTENT)
async def add_project(
    workspace_id: uuid.UUID,
    goal_id: uuid.UUID,
    data: LinkProjectRequest,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    goal = await get_goal(db, goal_id)
    await _verify_goal_workspace(goal, workspace_id)
    await link_project(db, goal_id, data.project_id)


@router.delete("/{goal_id}/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_project(
    workspace_id: uuid.UUID,
    goal_id: uuid.UUID,
    project_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    await unlink_project(db, goal_id, project_id)


@router.post("/{goal_id}/tasks", status_code=status.HTTP_204_NO_CONTENT)
async def add_task(
    workspace_id: uuid.UUID,
    goal_id: uuid.UUID,
    data: LinkTaskRequest,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    await get_goal(db, goal_id)  # 404 guard
    await link_task(db, goal_id, data.task_id)


@router.delete("/{goal_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_task(
    workspace_id: uuid.UUID,
    goal_id: uuid.UUID,
    task_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    await unlink_task(db, goal_id, task_id)


@router.get("/{goal_id}/projects")
async def list_linked_projects(
    workspace_id: uuid.UUID,
    goal_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select as sa_select
    from sqlalchemy.orm import selectinload

    from app.modules.pms.models.goal import GoalProjectLink
    links = await db.scalars(
        sa_select(GoalProjectLink)
        .where(GoalProjectLink.goal_id == goal_id)
        .options(selectinload(GoalProjectLink.project))
    )
    result = []
    for link in links.all():
        p = link.project
        result.append({"id": str(p.id), "name": p.name, "color": p.color})
    return result


@router.get("/{goal_id}/tasks")
async def list_linked_tasks(
    workspace_id: uuid.UUID,
    goal_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select as sa_select
    from sqlalchemy.orm import selectinload

    from app.modules.pms.models.goal import GoalTaskLink
    links = await db.scalars(
        sa_select(GoalTaskLink)
        .where(GoalTaskLink.goal_id == goal_id)
        .options(selectinload(GoalTaskLink.task))
    )
    result = []
    for link in links.all():
        t = link.task
        result.append({"id": str(t.id), "title": t.title, "status": t.status})
    return result
