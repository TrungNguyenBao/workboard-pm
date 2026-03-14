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


@router.get("/workspaces/{workspace_id}/analytics/velocity-detail")
async def get_velocity_detail(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    """Detailed velocity: avg days per owner, bottleneck identification."""
    from app.modules.crm.services.deal_velocity import get_velocity_detail

    return await get_velocity_detail(db, workspace_id)


@router.get("/workspaces/{workspace_id}/analytics/revenue-trend")
async def get_revenue_trend(
    workspace_id: uuid.UUID,
    months: int = Query(default=6, ge=1, le=24),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    """Monthly closed_won revenue trend for the last N months."""
    from app.modules.crm.services.crm_analytics import monthly_revenue_trend

    return await monthly_revenue_trend(db, workspace_id, months)


@router.get("/workspaces/{workspace_id}/analytics/funnel-conversion")
async def get_funnel_conversion(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    """Lead-to-close funnel with conversion percentages at each stage."""
    from app.modules.crm.services.crm_analytics import funnel_conversion

    return await funnel_conversion(db, workspace_id)


@router.get("/workspaces/{workspace_id}/analytics/top-deals")
async def get_top_deals(
    workspace_id: uuid.UUID,
    limit: int = Query(default=5, ge=1, le=20),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    """Top open deals sorted by value descending."""
    from app.modules.crm.services.crm_analytics import top_deals

    return await top_deals(db, workspace_id, limit)


@router.get("/workspaces/{workspace_id}/analytics/quality-score")
async def get_quality_score(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    """Overall CRM data quality score (0-100) with breakdown by dimension."""
    from app.modules.crm.services.data_quality import get_overall_quality_score

    return await get_overall_quality_score(db, workspace_id)
