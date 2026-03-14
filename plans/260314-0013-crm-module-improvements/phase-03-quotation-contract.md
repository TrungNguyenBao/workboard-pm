---
phase: 3
title: "Quotation + QuotationLine + Close-Deal Auto-create Contract"
sprint: Sprint 3
priority: P0
effort: 8h
status: pending
user_stories: [US-007, US-008]
gaps_addressed: [M2]
dependencies: [phase-01]
---

# Phase 3: Quotation & Close-Deal Contract Auto-creation

## Context
- US-007: Quotation with line items, discounts, tax (MISSING 0/8)
- US-008 AC3: Close Won auto-creates Contract (MISSING — Contract model from Phase 1)
- Depends on Phase 1: ProductService (quote lines reference products), Contract model

## New Model: Quotation

```python
__tablename__ = "crm_quotations"
id: UUID PK
deal_id: UUID FK deals.id, index
quote_number: str(50)  # auto: QT-YYYYMMDD-NNN
contact_id: UUID FK contacts.id, nullable
valid_until: date, nullable
subtotal: float, default=0
discount_pct: float, default=0
discount_amount: float, default=0
tax_pct: float, default=0
tax_amount: float, default=0
total: float, default=0
status: str(20), default="draft"  # draft | sent | accepted | rejected | expired
notes: text, nullable
version: int, default=1
created_by: UUID FK users.id, nullable
workspace_id: UUID FK
```

## New Model: QuotationLine

```python
__tablename__ = "crm_quotation_lines"
id: UUID PK
quotation_id: UUID FK crm_quotations.id, index, cascade delete
product_service_id: UUID FK crm_product_services.id, nullable
description: str(500)
quantity: float, default=1
unit_price: float
discount_pct: float, default=0
line_total: float  # computed: qty * unit_price * (1 - discount_pct/100)
position: int, default=0
```

## API Endpoints

### Quotation (nested under deal)
| Method | Path | Notes |
|--------|------|-------|
| POST | `/crm/workspaces/{wid}/deals/{did}/quotations` | Create draft |
| GET | `/crm/workspaces/{wid}/deals/{did}/quotations` | List per deal |
| GET | `/crm/workspaces/{wid}/quotations/{qid}` | Get with lines |
| PATCH | `/crm/workspaces/{wid}/quotations/{qid}` | Update |
| POST | `/crm/workspaces/{wid}/quotations/{qid}/send` | -> sent |
| POST | `/crm/workspaces/{wid}/quotations/{qid}/accept` | -> accepted, sync deal.value |
| POST | `/crm/workspaces/{wid}/quotations/{qid}/reject` | -> rejected |

### QuotationLine (nested under quotation)
| Method | Path |
|--------|------|
| POST | `/crm/workspaces/{wid}/quotations/{qid}/lines` |
| PATCH | `/crm/workspaces/{wid}/quotations/{qid}/lines/{lid}` |
| DELETE | `/crm/workspaces/{wid}/quotations/{qid}/lines/{lid}` |

## Key Business Logic

### Quote Auto-calculation (service)
On line add/update/delete, recalculate quotation totals:
```python
subtotal = SUM(line.line_total)
discount_amount = subtotal * (discount_pct / 100)
tax_amount = (subtotal - discount_amount) * (tax_pct / 100)
total = subtotal - discount_amount + tax_amount
```

### Quote Accept -> Deal Value Sync
`deal.value = quotation.total`

### Discount >20% Warning
Return `requires_approval: bool` in QuotationResponse. Advisory only, no blocking.

### Close Won Auto-create Contract (US-008 AC3)
Modify `deal_workflows.close_deal()`:
```python
if action == "won":
    # existing: create account if none
    # NEW: auto-create Contract (draft)
    from app.modules.crm.services.contract import create_contract
    contract = Contract(
        deal_id=deal.id,
        account_id=account.id,
        title=f"Contract - {deal.title}",
        value=deal.value,
        start_date=date.today(),
        status="draft",
        workspace_id=workspace_id,
    )
    db.add(contract)
```

### Close Lost with Competitor (US-008 AC5)
Add optional `competitor_id` param to `close_deal()`. Store on deal model (add nullable FK).

## Files to Create

### Backend
- `backend/app/modules/crm/models/quotation.py`
- `backend/app/modules/crm/models/quotation_line.py`
- `backend/app/modules/crm/schemas/quotation.py` (Quotation + QuotationLine schemas)
- `backend/app/modules/crm/services/quotation.py`
- `backend/app/modules/crm/routers/quotations.py`

### Frontend
- `frontend/src/modules/crm/features/deals/components/deal-quotations-tab.tsx`
- `frontend/src/modules/crm/features/deals/hooks/use-quotations.ts`
- `frontend/src/modules/crm/features/deals/components/quotation-form-dialog.tsx`
- `frontend/src/modules/crm/features/deals/components/quotation-line-editor.tsx`

## Files to Modify
- `backend/app/modules/crm/models/__init__.py` — add Quotation, QuotationLine imports
- `backend/app/modules/crm/models/deal.py` — add `competitor_id` FK (nullable)
- `backend/app/modules/crm/router.py` — include quotations router
- `backend/app/modules/crm/services/deal_workflows.py` — auto-create Contract on won + competitor on lost
- `backend/app/modules/crm/routers/workflows.py` — accept competitor_id in close request

## Migration
`alembic revision -m "add_crm_quotations_and_quotation_lines"`
- Tables: `crm_quotations`, `crm_quotation_lines`
- ALTER deals ADD competitor_id UUID FK nullable

## Implementation Steps
1. Create Quotation + QuotationLine models
2. Create schemas: QuotationCreate, QuotationUpdate, QuotationResponse, QuotationLineCreate/Update
3. Create quotation service: CRUD + auto-calc totals + send/accept/reject actions
4. Create router with nested deal/quotation paths
5. Update deal_workflows.close_deal(): auto-create Contract on won, accept competitor_id on lost
6. Add competitor_id to Deal model
7. Register models + router, generate migration
8. Frontend: quotation form with line item editor (product picker from Phase 1)
9. Frontend: deal-quotations-tab showing quote list per deal
10. Frontend: update deal-close-dialog for contract preview on won

## Success Criteria
- [ ] Quotations created with line items, auto-calculated totals
- [ ] Lifecycle: draft -> sent -> accepted/rejected/expired
- [ ] Accepted quote syncs deal.value
- [ ] Close Won auto-creates Account (existing) + Contract (new)
- [ ] Close Lost accepts competitor_id
- [ ] Discount >20% returns requires_approval flag
- [ ] Line items reference ProductService from Phase 1
