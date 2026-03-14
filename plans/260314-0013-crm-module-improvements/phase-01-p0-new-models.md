---
phase: 1
title: "P0 New Models — ProductService, Contract, CrmNotification, CrmAttachment, DealContactRole"
sprint: Sprint 1
priority: P0
effort: 8h
status: pending
user_stories: [US-005, US-008, US-022, US-023, US-006]
gaps_addressed: [M1, M3, M4, M7, M8]
dependencies: []
---

# Phase 1: P0 New Models

## Context
- [Gap Analysis](../../plans/reports/gap-analysis-260314-0016-crm-userstory-vs-code.md)
- US-005: ProductService catalog (MISSING 0/4)
- US-008 AC3/AC7: Contract + signed attachment (MISSING)
- US-022: CRM Notification system (MISSING 0/7)
- US-023: Attachments & Documents (MISSING 0/5)
- US-006 AC4: DealContactRole (MISSING)
- Follow existing patterns in `models/deal.py`, `services/deal.py`, `routers/deals.py`

## Overview
Add 5 foundational models that Phase 2-7 depend on. No logic refactors yet — pure CRUD + model creation.

---

## Model 1: ProductService (US-005)

```python
__tablename__ = "crm_product_services"
id: UUID PK
name: str(255)
code: str(50)  # unique per workspace
type: str(20)  # product | service | bundle
category: str(100), nullable
unit_price: float
currency: str(3), default="VND"
description: text, nullable
is_active: bool, default=True
workspace_id: UUID FK
created_by: UUID FK users.id, nullable
```

**Endpoints:** POST/GET(list)/GET(id)/PATCH/DELETE (soft-deactivate)
**Path:** `/crm/workspaces/{wid}/products`

## Model 2: Contract (US-008)

```python
__tablename__ = "crm_contracts"
id: UUID PK
deal_id: UUID FK deals.id, nullable, index
account_id: UUID FK accounts.id, index
contract_number: str(50)  # CT-YYYYMMDD-NNN
title: str(255)
start_date: date
end_date: date, nullable
value: float, default=0
billing_period: str(20), nullable  # monthly | quarterly | annual
auto_renewal: bool, default=False
status: str(20), default="draft"  # draft | active | expired | terminated
signed_date: date, nullable
notes: text, nullable
workspace_id: UUID FK
created_by: UUID FK users.id, nullable
```

**Endpoints:** POST/GET(list)/GET(id)/PATCH + POST activate + POST terminate
**Path:** `/crm/workspaces/{wid}/contracts`

## Model 3: CrmNotification (US-022)

```python
__tablename__ = "crm_notifications"
id: UUID PK
recipient_id: UUID FK users.id, index
type: str(50)  # lead_assigned | deal_stage | follow_up_due | stale_alert | mention
title: str(255)
body: text, nullable
entity_type: str(30), nullable  # lead | deal | account | contact | ticket
entity_id: UUID, nullable
is_read: bool, default=False
channel: str(20), default="in_app"
workspace_id: UUID FK
```

**Endpoints:** GET list (current user) / GET unread-count / POST mark-read / POST read-all
**Path:** `/crm/workspaces/{wid}/notifications`

## Model 4: CrmAttachment (US-023)

```python
__tablename__ = "crm_attachments"
id: UUID PK
entity_type: str(30)  # deal | account | contact | lead | ticket | contract
entity_id: UUID, index
file_name: str(255)
file_url: str(1000)
file_size: int, nullable
file_type: str(20)  # pdf | docx | xlsx | jpg | png
category: str(30), default="other"  # proposal | contract | nda | presentation | other
uploaded_by: UUID FK users.id, nullable
workspace_id: UUID FK
# Composite index: (entity_type, entity_id)
```

**Endpoints:** POST upload (multipart) / GET list (by entity) / GET download / DELETE
**Path:** `/crm/workspaces/{wid}/attachments`
**Storage:** `uploads/crm/{workspace_id}/{entity_type}/{filename}` — local disk, S3 later
**Validation:** allowed types pdf/docx/xlsx/pptx/jpg/png, max 10MB

## Model 5: DealContactRole (US-006)

```python
__tablename__ = "crm_deal_contact_roles"
id: UUID PK
deal_id: UUID FK deals.id, index
contact_id: UUID FK contacts.id, index
role: str(30)  # decision_maker | influencer | champion | user | evaluator
is_primary: bool, default=False
workspace_id: UUID FK
# Unique: (deal_id, contact_id)
```

**Endpoints:** POST/GET/PATCH/DELETE nested under deals
**Path:** `/crm/workspaces/{wid}/deals/{did}/contacts`

---

## Files to Create

### Backend (20 files)
- `models/product_service.py`, `models/contract.py`, `models/crm_notification.py`, `models/crm_attachment.py`, `models/deal_contact_role.py`
- `schemas/product_service.py`, `schemas/contract.py`, `schemas/crm_notification.py`, `schemas/crm_attachment.py`, `schemas/deal_contact_role.py`
- `services/product_service.py`, `services/contract.py`, `services/crm_notification.py`, `services/crm_attachment.py`, `services/deal_contact_role.py`
- `routers/products.py`, `routers/contracts.py`, `routers/notifications.py`, `routers/attachments.py`, `routers/deal_contacts.py`

All paths under `backend/app/modules/crm/`

### Frontend (10 files)
- `features/products/pages/products-list.tsx`
- `features/products/hooks/use-products.ts`
- `features/products/components/product-form-dialog.tsx`
- `features/contracts/pages/contracts-list.tsx`
- `features/contracts/hooks/use-contracts.ts`
- `features/contracts/components/contract-form-dialog.tsx`
- `features/notifications/components/notification-dropdown.tsx`
- `features/notifications/hooks/use-crm-notifications.ts`
- `features/attachments/components/attachment-list.tsx`
- `features/attachments/components/attachment-upload.tsx`

All paths under `frontend/src/modules/crm/`

## Files to Modify
- `backend/app/modules/crm/models/__init__.py` — 5 model imports
- `backend/app/modules/crm/router.py` — 5 router includes
- `frontend/src/app/router.tsx` — `/crm/products`, `/crm/contracts` routes

## Migration
`alembic revision -m "add_crm_products_contracts_notifications_attachments_deal_contacts"`

## Implementation Steps
1. Create all 5 models following `deal.py` pattern
2. Create Pydantic schemas (Create/Update/Response) for each
3. Create services: CRUD for each model, file upload logic for attachments
4. Create routers with workspace-scoped paths
5. Register in `models/__init__.py` and `router.py`
6. Generate Alembic migration
7. Frontend: products list + form, contracts list + form
8. Frontend: notification dropdown (bell + badge + list)
9. Frontend: attachment list + upload components (reusable across entities)
10. Add routes

## Success Criteria
- [ ] 5 new DB tables created with proper indexes
- [ ] CRUD APIs for all 5 models with pagination/search
- [ ] File upload with type/size validation
- [ ] Notification list with unread count
- [ ] DealContactRole enforces unique (deal_id, contact_id)
- [ ] Products list page with search/filter by type
- [ ] Contracts list page with status filter
