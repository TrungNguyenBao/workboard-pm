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


@router.get("/workspaces/{workspace_id}/analytics/velocity")
async def get_deal_velocity(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    """Deal velocity: avg days to close overall and breakdown by final stage."""
    from app.modules.crm.services.crm_analytics import get_crm_analytics

    data = await get_crm_analytics(db, workspace_id)
    return {
        "avg_days_total": data["deal_velocity_days"],
        "by_stage": data["deal_velocity_by_stage"],
    }
