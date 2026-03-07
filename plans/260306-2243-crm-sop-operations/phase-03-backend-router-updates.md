# Phase 3: Backend Router Updates

## Context Links
- [plan.md](./plan.md)
- [Phase 2](./phase-02-backend-service-logic.md)
- Existing routers: `backend/app/modules/crm/routers/`

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 3h
- **Depends on:** Phase 2 (service functions must exist)
- **Description:** Expose all new workflow logic as API endpoints. New endpoints in a dedicated workflows router; enhancements to existing routers inline.

## Endpoint Inventory

### New Endpoints (in `routers/workflows.py`)

| Method | Path | SOP | Purpose | RBAC |
|--------|------|-----|---------|------|
| POST | `/workspaces/{wid}/leads/distribute` | 03 | Round-robin assign unassigned leads | admin |
| GET | `/workspaces/{wid}/leads/stale` | 02 | Leads status=new older than 48h | member |
| POST | `/workspaces/{wid}/deals/{did}/close` | 07 | Close deal as won/lost | member |
| GET | `/workspaces/{wid}/deals/stale` | 05 | Deals with no activity >30 days | member |
| GET | `/workspaces/{wid}/accounts/follow-ups` | 10 | Accounts needing follow-up | member |
| GET | `/workspaces/{wid}/data-quality/report` | 12 | Data quality issues report | admin |
| GET | `/workspaces/{wid}/governance/alerts` | 15 | Governance alerts summary | admin |

### Enhanced Existing Endpoints

| Router File | Endpoint | Change | SOP |
|-------------|----------|--------|-----|
| `leads.py` | POST create | Return duplicate warning | 01 |
| `deals.py` | PATCH update | Stage validation + last_updated_by | 05 |
| `analytics.py` | GET analytics | Add start_date, end_date query params | 13 |
| `campaigns.py` | GET stats | Already exists, enhanced by service | 11 |

---

## New File: `routers/workflows.py` (~130 lines)

```python
"""Workflow endpoints for CRM SOP operations."""
import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User

router = APIRouter(tags=["crm"])


# --- Schemas (inline, small) ---

class DealCloseRequest(BaseModel):
    action: str  # "won" or "lost"
    loss_reason: str | None = None


class DistributeResponse(BaseModel):
    distributed_count: int
    lead_ids: list[str]


# --- Lead Workflows ---

@router.post("/workspaces/{workspace_id}/leads/distribute")
async def distribute_leads_endpoint(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    from app.modules.crm.services.lead_workflows import distribute_leads
    leads = await distribute_leads(db, workspace_id)
    return {
        "distributed_count": len(leads),
        "lead_ids": [str(l.id) for l in leads],
    }


@router.get("/workspaces/{workspace_id}/leads/stale")
async def get_stale_leads_endpoint(
    workspace_id: uuid.UUID,
    hours: int = Query(default=48, ge=1),
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    from app.modules.crm.services.lead_workflows import get_stale_leads
    leads = await get_stale_leads(db, workspace_id, hours)
    return {"count": len(leads), "leads": leads}


# --- Deal Workflows ---

@router.post("/workspaces/{workspace_id}/deals/{deal_id}/close")
async def close_deal_endpoint(
    workspace_id: uuid.UUID,
    deal_id: uuid.UUID,
    data: DealCloseRequest,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    from app.modules.crm.services.deal_workflows import close_deal
    deal = await close_deal(
        db, deal_id, workspace_id, data.action, data.loss_reason, current_user.id
    )
    return deal


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
```

---

## Modify: `routers/leads.py`

**Change `create` endpoint** to return duplicate warning:

```python
@router.post("/workspaces/{workspace_id}/leads", status_code=status.HTTP_201_CREATED)
async def create(
    workspace_id: uuid.UUID,
    data: LeadCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    lead = await create_lead(db, workspace_id, data)
    # create_lead now returns (lead, warning) tuple
    # The service handles the duplicate check internally
    return lead
```

Alternative: Keep return type as `LeadResponse`. The duplicate warning can be surfaced as a response header `X-Duplicate-Warning` to avoid breaking the schema. Simpler approach: add optional `_warnings: list[str]` to the response.

Decision: Use response header approach -- minimal schema impact, non-breaking.

---

## Modify: `routers/deals.py`

**Change `update` endpoint** to pass current_user for audit:

```python
@router.patch("/workspaces/{workspace_id}/deals/{deal_id}", response_model=DealResponse)
async def update(
    workspace_id: uuid.UUID,
    deal_id: uuid.UUID,
    data: DealUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_deal(db, deal_id, workspace_id, data, user_id=current_user.id)
```

Service signature update: `update_deal(..., user_id: uuid.UUID | None = None)`.

---

## Modify: `routers/analytics.py`

**Add date range query params:**

```python
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
```

---

## Modify: `router.py` (main CRM router)

Add workflows router:

```python
from app.modules.crm.routers import (
    accounts, activities, analytics, campaigns, contacts, deals, leads, tickets, workflows
)
# ... existing includes ...
crm_router.include_router(workflows.router)
```

---

## Route Ordering Note

The `/leads/distribute` and `/leads/stale` endpoints use path segments that could conflict with `/leads/{lead_id}`. Because they are in a separate router (`workflows.py`) included AFTER `leads.py`, FastAPI will match the more specific literal path first only if included BEFORE the parameterized route. Two solutions:

1. **Preferred:** Include `workflows.router` BEFORE `leads.router` in `router.py`
2. **Alternative:** Move distribute/stale endpoints into `leads.py` above the `{lead_id}` routes

Decision: Use option 1. Reorder includes in `router.py`:

```python
crm_router.include_router(workflows.router)  # first -- literal paths
crm_router.include_router(contacts.router)
crm_router.include_router(deals.router)
crm_router.include_router(leads.router)
# ... rest
```

---

## Workflow Schema File: `schemas/workflows.py` (~50 lines)

For typed responses from workflow endpoints:

```python
"""Request/response schemas for CRM workflow endpoints."""
import uuid
from pydantic import BaseModel


class DealCloseRequest(BaseModel):
    action: str  # "won" | "lost"
    loss_reason: str | None = None


class DistributeResponse(BaseModel):
    distributed_count: int
    lead_ids: list[uuid.UUID]


class StaleCountResponse(BaseModel):
    count: int


class DataQualityReport(BaseModel):
    duplicate_email_count: int
    incomplete_leads: int
    stale_contacts_90d: int
    ownerless_deals: int


class GovernanceAlerts(BaseModel):
    stale_deals_count: int
    stale_deals: list[dict]
    stale_leads_count: int
    unassigned_leads: int
    overdue_tickets: int
```

Note: Using these schemas as `response_model` in the router is optional for MVP. The dict returns from services are valid JSON responses. Add typed response models in a follow-up if stricter API contracts are needed.

---

## Implementation Steps

1. Create `schemas/workflows.py` with request/response models
2. Create `routers/workflows.py` with all 7 new endpoints
3. Modify `router.py` -- include workflows.router FIRST for path priority
4. Modify `routers/leads.py` -- add duplicate warning header to create endpoint
5. Modify `routers/deals.py` -- pass current_user.id to update_deal
6. Modify `routers/analytics.py` -- add start_date/end_date params
7. Test all new endpoints manually via Swagger UI
8. Run `make test`

## Related Code Files

### Create
- `backend/app/modules/crm/schemas/workflows.py`
- `backend/app/modules/crm/routers/workflows.py`

### Modify
- `backend/app/modules/crm/router.py`
- `backend/app/modules/crm/routers/leads.py`
- `backend/app/modules/crm/routers/deals.py`
- `backend/app/modules/crm/routers/analytics.py`

## Todo List
- [ ] Create schemas/workflows.py
- [ ] Create routers/workflows.py with 7 endpoints
- [ ] Modify router.py to include workflows router (first position)
- [ ] Modify leads.py -- duplicate warning on create
- [ ] Modify deals.py -- pass user_id to update_deal
- [ ] Modify analytics.py -- date range params
- [ ] Verify route ordering (no path conflicts)
- [ ] Test via Swagger UI
- [ ] Run make test

## Success Criteria
- All 7 new endpoints return correct responses
- POST `/leads/distribute` assigns leads and returns count
- POST `/deals/{id}/close` with action=won creates account
- POST `/deals/{id}/close` with action=lost requires loss_reason
- GET `/deals/stale` returns deals with no recent activity
- GET `/data-quality/report` returns quality metrics
- GET `/governance/alerts` returns all governance issues
- Date range filtering works on analytics endpoint
- No path conflicts between workflow routes and CRUD routes

## Risk Assessment
- **Path conflict:** `/leads/stale` vs `/leads/{lead_id}` -- mitigated by router include order
- **Response model mismatch:** Close deal returns Deal model but with new fields -- ensure DealResponse schema is updated (Phase 1)
- **Auth scope:** Governance and data-quality locked to admin; consider if member access is needed later
