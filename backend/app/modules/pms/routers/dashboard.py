import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.pms.schemas.task import TaskResponse
from app.modules.pms.services.dashboard import get_dashboard_stats
from app.modules.pms.services.task import list_my_tasks

router = APIRouter(tags=["dashboard"])


@router.get("/workspaces/{workspace_id}/pms/dashboard")
async def dashboard(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await get_dashboard_stats(db, workspace_id, current_user.id)


@router.get("/workspaces/{workspace_id}/my-tasks", response_model=list[TaskResponse])
async def my_tasks(
    workspace_id: uuid.UUID,
    priority: str | None = Query(default=None),
    status: str | None = Query(default=None),
    sort_by: str = Query(default="due_date", pattern="^(due_date|priority|created_at)$"),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await list_my_tasks(db, workspace_id, current_user.id, priority, status, sort_by)
