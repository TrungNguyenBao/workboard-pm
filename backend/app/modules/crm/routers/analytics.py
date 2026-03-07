import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User

router = APIRouter(tags=["crm"])


@router.get("/workspaces/{workspace_id}/analytics")
async def get_analytics(
    workspace_id: uuid.UUID,
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    from app.modules.crm.services.crm_analytics import get_crm_analytics

    return await get_crm_analytics(db, workspace_id, start_date, end_date)
