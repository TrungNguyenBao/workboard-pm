import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_project_role
from app.models.user import User
from app.schemas.activity_log import ActivityLogResponse
from app.services.activity_log import list_activity

router = APIRouter(tags=["activity"])


@router.get(
    "/projects/{project_id}/activity",
    response_model=list[ActivityLogResponse],
)
async def project_activity(
    project_id: uuid.UUID,
    limit: int = Query(default=50, le=100),
    cursor: str | None = Query(default=None),
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await list_activity(db, project_id=project_id, limit=limit, cursor=cursor)


@router.get(
    "/projects/{project_id}/tasks/{task_id}/activity",
    response_model=list[ActivityLogResponse],
)
async def task_activity(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    limit: int = Query(default=20, le=100),
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await list_activity(
        db, entity_type="task", entity_id=task_id, limit=limit
    )
