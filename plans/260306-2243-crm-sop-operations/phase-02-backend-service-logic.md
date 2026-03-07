# Phase 2: Backend Service Logic

## Context Links
- [plan.md](./plan.md)
- [Phase 1](./phase-01-models-schemas-migration.md)
- Existing services: `backend/app/modules/crm/services/`

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 5h
- **Depends on:** Phase 1 (model fields must exist)
- **Description:** Implement all SOP business rules as service functions. New workflow services in separate files; enhancements to existing services via inline edits.

## Architecture Decision

To respect the 200-line limit, workflow logic goes in NEW service files rather than bloating existing ones. Existing CRUD services get minimal edits (status validation calls, auto-field updates).

| File | Purpose | Est. Lines |
|------|---------|------------|
| `services/lead-workflows.py` (NEW) | Duplicate check, scoring, round-robin distribution | ~120 |
| `services/deal-workflows.py` (NEW) | Stage validation, close workflow, stale query | ~130 |
| `services/data-quality.py` (NEW) | Duplicate scan, completeness check, stale data | ~100 |
| `services/governance.py` (NEW) | Aggregate governance alerts | ~80 |
| `services/status-flows.py` (Phase 1) | Transition maps + validate helper | ~50 |
| `services/lead.py` (MODIFY) | Add validation calls in create/update | ~110 |
| `services/deal.py` (MODIFY) | Add validation calls in update | ~100 |
| `services/activity.py` (MODIFY) | Auto-update deal.last_activity_date, lead.contacted_at | ~100 |
| `services/ticket.py` (MODIFY) | Status flow validation, auto-set resolved_at/closed_at | ~100 |
| `services/account.py` (MODIFY) | No changes needed (account creation handled by deal close) |  |
| `services/campaign.py` (MODIFY) | Enhance get_campaign_stats with ROI calculation | ~110 |
| `services/crm_analytics.py` (MODIFY) | Add date range, funnel, velocity metrics | ~150 |

---

## SOP 01 -- Lead Creation: Duplicate Detection

**File:** `services/lead-workflows.py`

```python
async def check_lead_duplicates(
    db: AsyncSession, workspace_id: uuid.UUID, email: str | None, phone: str | None
) -> list[Lead]:
    """Return existing leads matching email or phone within workspace."""
    if not email and not phone:
        return []
    conditions = []
    if email:
        conditions.append(Lead.email == email)
    if phone:
        conditions.append(Lead.phone == phone)
    q = select(Lead).where(Lead.workspace_id == workspace_id, or_(*conditions))
    result = await db.scalars(q)
    return list(result.all())
```

**Modify** `services/lead.py` `create_lead()`:
- Before insert, call `check_lead_duplicates()`
- If duplicates found, still create but include `duplicate_warning` in return
- Add `validate_email_format()` and `validate_phone_format()` checks (simple regex)

Schema impact: Add `LeadCreateResponse` to `schemas/workflows.py` that extends `LeadResponse` with optional `duplicate_warning: str | None`.

---

## SOP 02 -- Lead Qualification: Scoring + Status Flow

**File:** `services/lead-workflows.py`

```python
def calculate_lead_score(lead: Lead) -> int:
    """Score based on source quality + data completeness."""
    score = 0
    source_scores = {"website": 15, "ads": 10, "form": 20, "referral": 25, "manual": 5}
    score += source_scores.get(lead.source, 5)
    if lead.email:
        score += 20
    if lead.phone:
        score += 15
    if lead.campaign_id:
        score += 10
    return min(score, 100)

async def get_stale_leads(
    db: AsyncSession, workspace_id: uuid.UUID, hours: int = 48
) -> list[Lead]:
    """Leads with status='new' created more than `hours` ago."""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    q = select(Lead).where(
        Lead.workspace_id == workspace_id,
        Lead.status == "new",
        Lead.created_at < cutoff,
    )
    result = await db.scalars(q)
    return list(result.all())
```

**Modify** `services/lead.py`:
- In `create_lead()`: auto-calculate score via `calculate_lead_score()` if score not explicitly set
- In `update_lead()`: validate status transitions using `status-flows.py` `validate_transition()`

---

## SOP 03 -- Lead Distribution: Round-Robin

**File:** `services/lead-workflows.py`

```python
async def distribute_leads(
    db: AsyncSession, workspace_id: uuid.UUID
) -> list[Lead]:
    """Assign unassigned leads to workspace members via round-robin."""
    # 1. Get unassigned leads (status=new, owner_id=None)
    unassigned = await db.scalars(
        select(Lead).where(
            Lead.workspace_id == workspace_id,
            Lead.owner_id.is_(None),
            Lead.status == "new",
        ).order_by(Lead.created_at)
    )
    leads = list(unassigned.all())
    if not leads:
        return []

    # 2. Get workspace members
    members = await db.scalars(
        select(WorkspaceMember.user_id).where(
            WorkspaceMember.workspace_id == workspace_id
        )
    )
    member_ids = list(members.all())
    if not member_ids:
        return []

    # 3. Find last assigned member for round-robin continuity
    last_assigned = await db.scalar(
        select(Lead.owner_id).where(
            Lead.workspace_id == workspace_id,
            Lead.owner_id.isnot(None),
        ).order_by(Lead.assigned_at.desc().nullslast()).limit(1)
    )
    start_idx = 0
    if last_assigned and last_assigned in member_ids:
        start_idx = (member_ids.index(last_assigned) + 1) % len(member_ids)

    # 4. Assign
    now = datetime.utcnow()
    for i, lead in enumerate(leads):
        idx = (start_idx + i) % len(member_ids)
        lead.owner_id = member_ids[idx]
        lead.assigned_at = now

    await db.commit()
    return leads
```

Note: Must import `WorkspaceMember` from shared models. Check exact model location via `backend/app/models/`.

---

## SOP 04 -- Opportunity Creation: Validation

**Modify** `services/lead.py` `convert_lead_to_opportunity()`:

```python
# Add before conversion:
if lead.status != "qualified":
    raise HTTPException(
        status_code=400,
        detail="Only qualified leads can be converted to opportunities"
    )

# Enhance deal creation:
score = lead.score or calculate_lead_score(lead)
probability_map = {"website": 0.3, "ads": 0.2, "form": 0.35, "referral": 0.4, "manual": 0.15}
deal = Deal(
    title=f"Opportunity: {lead.name}",
    value=score * 100,  # rough estimation from score
    stage="qualified",
    probability=probability_map.get(lead.source, 0.2),
    lead_id=lead.id,
    workspace_id=workspace_id,
)
```

---

## SOP 05 -- Pipeline Management: Stage Validation + Stale Deals

**File:** `services/deal-workflows.py`

```python
async def get_stale_deals(
    db: AsyncSession, workspace_id: uuid.UUID, days: int = 30
) -> list[Deal]:
    """Deals with no activity for more than `days` days (excluding closed)."""
    cutoff = datetime.utcnow() - timedelta(days=days)
    closed = ["closed_won", "closed_lost"]
    q = select(Deal).where(
        Deal.workspace_id == workspace_id,
        Deal.stage.notin_(closed),
        or_(
            Deal.last_activity_date < cutoff,
            and_(Deal.last_activity_date.is_(None), Deal.created_at < cutoff),
        ),
    )
    result = await db.scalars(q)
    return list(result.all())

def validate_stage_transition(current: str, target: str) -> bool:
    """Check if stage transition is valid per pipeline rules."""
    from app.modules.crm.services.status_flows import DEAL_STAGE_TRANSITIONS
    allowed = DEAL_STAGE_TRANSITIONS.get(current, [])
    return target in allowed
```

**Modify** `services/deal.py` `update_deal()`:
- If `data.stage` provided and differs from current, call `validate_stage_transition()`
- If new stage is past "proposal" and `expected_close_date` not set, raise 400
- Pass `current_user.id` to set `last_updated_by`

---

## SOP 06 -- Activity Logging: Outcome + Auto-Updates

**Modify** `services/activity.py` `create_activity()`:

```python
async def create_activity(db, workspace_id, data) -> Activity:
    activity = Activity(workspace_id=workspace_id, **data.model_dump())
    db.add(activity)

    # Auto-update deal.last_activity_date
    if activity.deal_id:
        deal = await db.get(Deal, activity.deal_id)
        if deal and deal.workspace_id == workspace_id:
            deal.last_activity_date = activity.date

    # Auto-update lead.contacted_at (first activity sets it)
    if activity.lead_id:
        lead = await db.get(Lead, activity.lead_id)
        if lead and lead.workspace_id == workspace_id and not lead.contacted_at:
            lead.contacted_at = activity.date

    await db.commit()
    await db.refresh(activity)
    return activity
```

---

## SOP 07 -- Deal Closing Workflow

**File:** `services/deal-workflows.py`

```python
async def close_deal(
    db: AsyncSession,
    deal_id: uuid.UUID,
    workspace_id: uuid.UUID,
    action: str,  # "won" or "lost"
    loss_reason: str | None = None,
    user_id: uuid.UUID | None = None,
) -> Deal:
    deal = await get_deal(db, deal_id, workspace_id)
    now = datetime.utcnow()

    if deal.stage in ("closed_won", "closed_lost"):
        raise HTTPException(400, "Deal is already closed")

    if action == "won":
        deal.stage = "closed_won"
        deal.probability = 1.0
        deal.closed_at = now
        # Auto-create account if none linked
        if not deal.account_id:
            account = Account(
                name=deal.title.replace("Opportunity: ", ""),
                total_revenue=deal.value,
                source_deal_id=deal.id,
                workspace_id=workspace_id,
            )
            db.add(account)
            await db.flush()
            deal.account_id = account.id
            # Link contact to account if contact exists
            if deal.contact_id:
                contact = await db.get(Contact, deal.contact_id)
                if contact:
                    contact.account_id = account.id

    elif action == "lost":
        if not loss_reason:
            raise HTTPException(400, "loss_reason is required for closed_lost")
        deal.stage = "closed_lost"
        deal.probability = 0.0
        deal.closed_at = now
        deal.loss_reason = loss_reason
    else:
        raise HTTPException(400, f"Invalid close action: {action}")

    if user_id:
        deal.last_updated_by = user_id

    await db.commit()
    await db.refresh(deal)
    return deal
```

---

## SOP 09 -- Customer Support: Status Flow + Auto-Timestamps

**Modify** `services/ticket.py` `update_ticket()`:

```python
# Add status transition validation:
if data.status and data.status != ticket.status:
    from app.modules.crm.services.status_flows import TICKET_STATUS_TRANSITIONS
    allowed = TICKET_STATUS_TRANSITIONS.get(ticket.status, [])
    if data.status not in allowed:
        raise HTTPException(400, f"Cannot transition from {ticket.status} to {data.status}")
    # Auto-set timestamps
    now = datetime.utcnow()
    if data.status == "resolved":
        ticket.resolved_at = now
    elif data.status == "closed":
        ticket.closed_at = now
```

---

## SOP 10 -- Customer Retention: Health Score

**File:** `services/account.py` (add function, file stays under 140 lines)

```python
async def calculate_health_score(
    db: AsyncSession, account_id: uuid.UUID, workspace_id: uuid.UUID
) -> int:
    """Calculate account health: 0-100 based on activity, tickets, revenue."""
    score = 100
    # Deduct for open tickets
    open_tickets = await db.scalar(
        select(func.count(Ticket.id)).where(
            Ticket.account_id == account_id,
            Ticket.status.in_(["open", "in_progress"]),
        )
    ) or 0
    score -= min(open_tickets * 10, 30)

    # Deduct for no recent activity (90 days)
    cutoff = datetime.utcnow() - timedelta(days=90)
    recent_activities = await db.scalar(
        select(func.count(Activity.id)).where(
            Activity.workspace_id == workspace_id,
            Activity.contact_id.in_(
                select(Contact.id).where(Contact.account_id == account_id)
            ),
            Activity.date > cutoff,
        )
    ) or 0
    if recent_activities == 0:
        score -= 30

    # Boost for high revenue
    account = await get_account(db, account_id, workspace_id)
    if account.total_revenue > 10000:
        score += 10

    return max(0, min(score, 100))

async def get_accounts_needing_follow_up(
    db: AsyncSession, workspace_id: uuid.UUID
) -> list[Account]:
    """Accounts with next_follow_up_date <= today."""
    today = date.today()
    q = select(Account).where(
        Account.workspace_id == workspace_id,
        Account.next_follow_up_date <= today,
        Account.status == "active",
    )
    result = await db.scalars(q)
    return list(result.all())
```

---

## SOP 11 -- Campaign Management: Enhanced ROI

**Modify** `services/campaign.py` `get_campaign_stats()`:

Add revenue calculation by tracing: campaign -> leads -> deals(closed_won) -> sum(value).

```python
# After existing stats, add:
won_deal_value = await db.scalar(
    select(func.coalesce(func.sum(Deal.value), 0.0)).where(
        Deal.lead_id.in_(
            select(Lead.id).where(Lead.campaign_id == campaign_id)
        ),
        Deal.stage == "closed_won",
    )
) or 0.0

cost_per_lead = (campaign.actual_cost / total_leads) if total_leads > 0 else 0
roi = ((won_deal_value - campaign.actual_cost) / campaign.actual_cost * 100) if campaign.actual_cost > 0 else 0

# Add to return dict:
"won_deal_value": won_deal_value,
"cost_per_lead": round(cost_per_lead, 2),
"roi_percent": round(roi, 1),
```

---

## SOP 12 -- Data Quality Service

**File:** `services/data-quality.py` (NEW, ~100 lines)

```python
async def get_data_quality_report(db: AsyncSession, workspace_id: uuid.UUID) -> dict:
    """Aggregate data quality issues across CRM entities."""
    # 1. Duplicate leads (same email or phone)
    dup_email_q = (
        select(Lead.email, func.count(Lead.id).label("cnt"))
        .where(Lead.workspace_id == workspace_id, Lead.email.isnot(None))
        .group_by(Lead.email)
        .having(func.count(Lead.id) > 1)
    )
    dup_emails = await db.execute(dup_email_q)
    duplicate_email_count = len(list(dup_emails.all()))

    # 2. Incomplete leads (missing email AND phone)
    incomplete_leads = await db.scalar(
        select(func.count(Lead.id)).where(
            Lead.workspace_id == workspace_id,
            Lead.email.is_(None),
            Lead.phone.is_(None),
        )
    ) or 0

    # 3. Stale contacts (no activity in 90 days)
    cutoff_90 = datetime.utcnow() - timedelta(days=90)
    active_contact_ids = select(Activity.contact_id).where(
        Activity.workspace_id == workspace_id,
        Activity.date > cutoff_90,
        Activity.contact_id.isnot(None),
    ).distinct()
    stale_contacts = await db.scalar(
        select(func.count(Contact.id)).where(
            Contact.workspace_id == workspace_id,
            Contact.id.notin_(active_contact_ids),
        )
    ) or 0

    # 4. Deals without owner
    ownerless_deals = await db.scalar(
        select(func.count(Deal.id)).where(
            Deal.workspace_id == workspace_id,
            Deal.owner_id.is_(None),
            Deal.stage.notin_(["closed_won", "closed_lost"]),
        )
    ) or 0

    return {
        "duplicate_email_count": duplicate_email_count,
        "incomplete_leads": incomplete_leads,
        "stale_contacts_90d": stale_contacts,
        "ownerless_deals": ownerless_deals,
    }
```

---

## SOP 13 -- Enhanced Analytics

**Modify** `services/crm_analytics.py` `get_crm_analytics()`:

Add parameters and metrics:
- `start_date: date | None`, `end_date: date | None` -- filter all counts by date range
- `deal_velocity`: average days deals spend in each stage (approximate: `avg(updated_at - created_at)` for closed deals)
- `sales_funnel`: `{"total_leads": N, "qualified": N, "opportunity": N, "closed_won": N}`

The function is already ~97 lines. Adding date range filtering and funnel data will push it toward ~150 lines. Split the funnel calculation into a helper if needed.

---

## SOP 15 -- Governance Alerts

**File:** `services/governance.py` (NEW, ~80 lines)

```python
async def get_governance_alerts(db: AsyncSession, workspace_id: uuid.UUID) -> dict:
    """Aggregate governance issues per SOP 15."""
    from .deal_workflows import get_stale_deals
    from .lead_workflows import get_stale_leads

    stale_deals = await get_stale_deals(db, workspace_id, days=30)
    stale_leads = await get_stale_leads(db, workspace_id, hours=48)

    # Unassigned leads
    unassigned_leads = await db.scalar(
        select(func.count(Lead.id)).where(
            Lead.workspace_id == workspace_id,
            Lead.owner_id.is_(None),
            Lead.status == "new",
        )
    ) or 0

    # Overdue tickets
    overdue_tickets = await db.scalar(
        select(func.count(Ticket.id)).where(
            Ticket.workspace_id == workspace_id,
            Ticket.status.in_(["open", "in_progress"]),
            Ticket.created_at < (datetime.utcnow() - timedelta(days=7)),
        )
    ) or 0

    return {
        "stale_deals_count": len(stale_deals),
        "stale_deals": [{"id": str(d.id), "title": d.title, "stage": d.stage} for d in stale_deals[:10]],
        "stale_leads_count": len(stale_leads),
        "unassigned_leads": unassigned_leads,
        "overdue_tickets": overdue_tickets,
    }
```

---

## Implementation Steps

1. Create `services/status-flows.py` (Phase 1 deliverable, listed here for reference)
2. Create `services/lead-workflows.py` -- duplicate check, scoring, distribution, stale leads
3. Create `services/deal-workflows.py` -- stage validation, close workflow, stale deals
4. Create `services/data-quality.py` -- data quality report
5. Create `services/governance.py` -- governance alerts
6. Modify `services/lead.py` -- add duplicate check in create, status validation in update, enhance convert
7. Modify `services/deal.py` -- add stage validation in update, last_updated_by tracking
8. Modify `services/activity.py` -- auto-update deal.last_activity_date and lead.contacted_at
9. Modify `services/ticket.py` -- add status flow validation, auto-set resolved_at/closed_at
10. Modify `services/campaign.py` -- enhance get_campaign_stats with ROI
11. Modify `services/crm_analytics.py` -- add date range, funnel, velocity
12. Run tests after each service modification

## Related Code Files

### Create
- `backend/app/modules/crm/services/lead-workflows.py`
- `backend/app/modules/crm/services/deal-workflows.py`
- `backend/app/modules/crm/services/data-quality.py`
- `backend/app/modules/crm/services/governance.py`

### Modify
- `backend/app/modules/crm/services/lead.py`
- `backend/app/modules/crm/services/deal.py`
- `backend/app/modules/crm/services/activity.py`
- `backend/app/modules/crm/services/ticket.py`
- `backend/app/modules/crm/services/campaign.py`
- `backend/app/modules/crm/services/crm_analytics.py`

## Todo List
- [ ] Create lead-workflows.py (duplicate check, scoring, distribution, stale)
- [ ] Create deal-workflows.py (stage validation, close, stale)
- [ ] Create data-quality.py
- [ ] Create governance.py
- [ ] Modify lead.py -- duplicate check on create, status validation on update, enhance convert
- [ ] Modify deal.py -- stage validation on update
- [ ] Modify activity.py -- auto-update deal/lead timestamps
- [ ] Modify ticket.py -- status flow validation + auto-timestamps
- [ ] Modify campaign.py -- ROI calculation
- [ ] Modify crm_analytics.py -- date range + funnel + velocity
- [ ] Run tests

## Success Criteria
- `create_lead` warns on duplicates, auto-scores
- `update_lead` rejects invalid status transitions
- `distribute_leads` assigns via round-robin
- `convert_lead_to_opportunity` rejects non-qualified leads
- `update_deal` rejects invalid stage transitions
- `close_deal` handles won/lost with auto-account-creation
- `create_activity` auto-updates deal/lead timestamps
- `update_ticket` enforces status flow and sets timestamps
- `get_campaign_stats` returns ROI/cost-per-lead
- `get_data_quality_report` returns duplicate/completeness/stale counts
- `get_governance_alerts` returns stale deals, unassigned leads, overdue tickets
- All files remain under 200 lines

## Risk Assessment
- **WorkspaceMember model location**: must verify import path for round-robin distribution
- **Circular imports**: new workflow files import from existing services -- use late imports where needed
- **Performance**: governance + data quality queries scan tables -- acceptable for MVP, add indexes later if needed
