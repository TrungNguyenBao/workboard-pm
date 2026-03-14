"""Workflow endpoints for CRM SOP operations."""
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.deal import DealCloseRequest, DealResponse

router = APIRouter(tags=["crm"])


# --- Lead Workflows ---


@router.post("/workspaces/{workspace_id}/leads/distribute")
async def distribute_leads_endpoint(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    from app.modules.crm.services.lead_workflows import distribute_leads

    leads = await distribute_leads(db, workspace_id)
    return {"distributed_count": len(leads), "lead_ids": [str(lead.id) for lead in leads]}


@router.get("/workspaces/{workspace_id}/leads/stale")
async def get_stale_leads_endpoint(
    workspace_id: uuid.UUID,
    days: int = Query(default=30, ge=1),
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    from app.modules.crm.services.lead_workflows import get_stale_leads

    leads = await get_stale_leads(db, workspace_id, days)
    return {"count": len(leads), "leads": leads}


# --- Deal Workflows ---


@router.post("/workspaces/{workspace_id}/deals/{deal_id}/close")
async def close_deal_endpoint(
    workspace_id: uuid.UUID,
    deal_id: uuid.UUID,
    body: DealCloseRequest,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    from app.modules.crm.services.deal_workflows import close_deal

    deal = await close_deal(
        db, deal_id, workspace_id, body.action, body.loss_reason, current_user.id,
        competitor_id=body.competitor_id,
    )
    return deal


@router.post("/workspaces/{workspace_id}/deals/{deal_id}/reopen", response_model=DealResponse)
async def reopen_deal_endpoint(
    workspace_id: uuid.UUID,
    deal_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    from app.modules.crm.services.deal_workflows import reopen_deal

    return await reopen_deal(db, deal_id, workspace_id, user_id=current_user.id)


@router.get("/workspaces/{workspace_id}/deals/stale")
async def get_stale_deals_endpoint(
    workspace_id: uuid.UUID,
    days: int = Query(default=30, ge=1),
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    from app.modules.crm.services.deal_workflows import get_stale_deals

    deals = await get_stale_deals(db, workspace_id, days)
    return {"count": len(deals), "deals": deals}


# --- Account Workflows ---


@router.get("/workspaces/{workspace_id}/accounts/follow-ups")
async def get_follow_ups_endpoint(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    from app.modules.crm.services.account import get_accounts_needing_follow_up

    accounts = await get_accounts_needing_follow_up(db, workspace_id)
    return {"count": len(accounts), "accounts": accounts}


# --- Data Quality & Governance ---


@router.get("/workspaces/{workspace_id}/data-quality/report")
async def get_data_quality_endpoint(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    from app.modules.crm.services.data_quality import get_data_quality_report

    return await get_data_quality_report(db, workspace_id)


@router.get("/workspaces/{workspace_id}/governance/alerts")
async def get_governance_alerts_endpoint(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    from app.modules.crm.services.governance import get_governance_alerts

    return await get_governance_alerts(db, workspace_id)
