# Phase 1: Model & Schema Updates + Migration

## Context Links
- [plan.md](./plan.md)
- [SOP_CRM.md](../../SOP_CRM.md)
- [CRM_PRD.md](../../CRM_PRD.md)

## Overview
- **Priority:** P1 (foundation for all other phases)
- **Status:** pending
- **Effort:** 3h
- **Description:** Add all new fields to existing models, update Pydantic schemas, create single Alembic migration, add status flow validation constants.

## Key Insights
- All models use `TimestampMixin` (created_at, updated_at auto-managed)
- Models use SQLAlchemy 2.0 `Mapped[]` syntax
- Schemas use Pydantic v2 `BaseModel` with `model_config = {"from_attributes": True}`
- Lead already has `score: int` field -- reuse for scoring logic
- Deal already has `lead_id` FK -- used by convert flow

## New Fields Per Model

### Lead (`backend/app/modules/crm/models/lead.py`)
| Field         | Type                       | SOP  | Purpose                        |
|---------------|----------------------------|------|--------------------------------|
| contacted_at  | DateTime(tz), nullable     | 02   | When first contacted           |
| assigned_at   | DateTime(tz), nullable     | 03   | When assigned to sales rep     |

### Deal (`backend/app/modules/crm/models/deal.py`)
| Field              | Type                     | SOP  | Purpose                       |
|--------------------|--------------------------|------|-------------------------------|
| last_activity_date | DateTime(tz), nullable   | 05   | Track stale deals             |
| loss_reason        | String(255), nullable    | 07   | Required on closed_lost       |
| closed_at          | DateTime(tz), nullable   | 07   | Auto-set on close             |
| owner_id           | FK(users.id), nullable   | 05   | Deal owner for governance     |
| last_updated_by    | FK(users.id), nullable   | 15   | Audit trail                   |

### Activity (`backend/app/modules/crm/models/activity.py`)
| Field            | Type                     | SOP  | Purpose                     |
|------------------|--------------------------|------|-----------------------------|
| outcome          | String(50), nullable     | 06   | completed/pending/cancelled |
| next_action_date | DateTime(tz), nullable   | 06   | Schedule follow-up          |

### Ticket (`backend/app/modules/crm/models/ticket.py`)
| Field            | Type                     | SOP  | Purpose                     |
|------------------|--------------------------|------|-----------------------------|
| resolved_at      | DateTime(tz), nullable   | 09   | When resolved               |
| closed_at        | DateTime(tz), nullable   | 09   | When closed                 |
| resolution_notes | Text, nullable           | 09   | Resolution details          |

### Account (`backend/app/modules/crm/models/account.py`)
| Field              | Type                     | SOP  | Purpose                     |
|--------------------|--------------------------|------|-----------------------------|
| source_deal_id     | FK(deals.id), nullable   | 08   | Which deal created account  |
| next_follow_up_date| Date, nullable           | 10   | Retention follow-up         |
| health_score       | Integer, default=100     | 10   | Customer health 0-100       |

## Schema Updates

Each model's schema triad (Create, Update, Response) must be updated to include new fields.

### `backend/app/modules/crm/schemas/lead.py`
- **LeadCreate**: no new fields (contacted_at/assigned_at are set by service logic)
- **LeadUpdate**: add `contacted_at: datetime | None = None`
- **LeadResponse**: add `contacted_at: datetime | None`, `assigned_at: datetime | None`

### `backend/app/modules/crm/schemas/deal.py`
- **DealCreate**: add `owner_id: uuid.UUID | None = None`
- **DealUpdate**: add `loss_reason: str | None`, `owner_id: uuid.UUID | None`
- **DealResponse**: add `last_activity_date`, `loss_reason`, `closed_at`, `owner_id`, `last_updated_by`

### `backend/app/modules/crm/schemas/activity.py`
- **ActivityCreate**: add `outcome: str | None = None`, `next_action_date: datetime | None = None`
- **ActivityUpdate**: add same two fields
- **ActivityResponse**: add same two fields

### `backend/app/modules/crm/schemas/ticket.py`
- **TicketCreate**: no new fields (resolved_at/closed_at set by service)
- **TicketUpdate**: add `resolution_notes: str | None = None`
- **TicketResponse**: add `resolved_at`, `closed_at`, `resolution_notes`

### `backend/app/modules/crm/schemas/account.py`
- **AccountCreate**: add `source_deal_id: uuid.UUID | None = None`
- **AccountUpdate**: add `next_follow_up_date: date | None`, `health_score: int | None`
- **AccountResponse**: add `source_deal_id`, `next_follow_up_date`, `health_score`

## Status Flow Constants

Add to a new file `backend/app/modules/crm/services/status-flows.py` (~40 lines):

```python
"""Valid status transitions for CRM entities."""

LEAD_STATUS_TRANSITIONS: dict[str, list[str]] = {
    "new": ["contacted", "disqualified"],
    "contacted": ["qualified", "lost", "disqualified"],
    "qualified": ["opportunity", "lost", "disqualified"],
    "opportunity": [],  # terminal via deal conversion
    "lost": ["new"],  # allow re-open
    "disqualified": ["new"],  # allow re-open
}

DEAL_STAGE_ORDER = [
    "lead", "qualified", "needs_analysis",
    "proposal", "negotiation", "closed_won", "closed_lost",
]

DEAL_STAGE_TRANSITIONS: dict[str, list[str]] = {
    "lead": ["qualified", "closed_lost"],
    "qualified": ["needs_analysis", "closed_lost"],
    "needs_analysis": ["proposal", "closed_lost"],
    "proposal": ["negotiation", "closed_lost"],
    "negotiation": ["closed_won", "closed_lost"],
    "closed_won": [],
    "closed_lost": [],
}

TICKET_STATUS_TRANSITIONS: dict[str, list[str]] = {
    "open": ["in_progress"],
    "in_progress": ["resolved", "open"],
    "resolved": ["closed", "open"],
    "closed": [],
}

ACTIVITY_OUTCOMES = ["completed", "pending", "cancelled"]
```

## Migration

Create single Alembic migration:
```bash
make migrate-create name="crm_sop_workflow_fields"
```

Migration adds all nullable columns. No data migration needed -- all new fields are nullable or have defaults.

## Implementation Steps

1. Update `backend/app/modules/crm/models/lead.py` -- add 2 fields (file ~30 lines)
2. Update `backend/app/modules/crm/models/deal.py` -- add 5 fields (file ~35 lines)
3. Update `backend/app/modules/crm/models/activity.py` -- add 2 fields (file ~30 lines)
4. Update `backend/app/modules/crm/models/ticket.py` -- add 3 fields (file ~30 lines)
5. Update `backend/app/modules/crm/models/account.py` -- add 3 fields (file ~30 lines)
6. Create `backend/app/modules/crm/services/status-flows.py` (~40 lines)
7. Update all 6 schema files (lead, deal, activity, ticket, account) -- add new fields to triads
8. Run `make migrate-create name="crm_sop_workflow_fields"`
9. Run `make migrate` to apply
10. Run `make test` to verify no regressions

## Related Code Files

### Modify
- `backend/app/modules/crm/models/lead.py`
- `backend/app/modules/crm/models/deal.py`
- `backend/app/modules/crm/models/activity.py`
- `backend/app/modules/crm/models/ticket.py`
- `backend/app/modules/crm/models/account.py`
- `backend/app/modules/crm/schemas/lead.py`
- `backend/app/modules/crm/schemas/deal.py`
- `backend/app/modules/crm/schemas/activity.py`
- `backend/app/modules/crm/schemas/ticket.py`
- `backend/app/modules/crm/schemas/account.py`

### Create
- `backend/app/modules/crm/services/status-flows.py`

## Todo List
- [ ] Add contacted_at, assigned_at to Lead model
- [ ] Add last_activity_date, loss_reason, closed_at, owner_id, last_updated_by to Deal model
- [ ] Add outcome, next_action_date to Activity model
- [ ] Add resolved_at, closed_at, resolution_notes to Ticket model
- [ ] Add source_deal_id, next_follow_up_date, health_score to Account model
- [ ] Create status-flows.py with transition maps
- [ ] Update all schema files
- [ ] Generate and apply Alembic migration
- [ ] Run tests

## Success Criteria
- All models have new fields
- Schemas expose new fields in responses
- Migration applies cleanly
- Existing tests pass

## Risk Assessment
- **Low risk:** all new fields are nullable/defaulted, no breaking changes
- **Migration conflict:** if other migrations are in-flight, may need rebase
