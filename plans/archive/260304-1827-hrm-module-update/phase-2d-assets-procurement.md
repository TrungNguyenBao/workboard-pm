---
phase: 2D
title: "Asset Management & Procurement"
status: pending
priority: P2
effort: 5h
depends_on: []
---

# Phase 2D — Asset Management & Procurement

## Context
- [Brainstorm Report](../reports/brainstorm-260304-1818-hrm-module-update.md)
- Independent — no dependencies on other phases
- Kept inside HRM module (admin features)
- 4 new entities: assets, asset_assignments, purchase_requests, purchase_items

## Overview
Track company assets (laptops, phones, furniture) with employee assignment history. Procurement workflow for purchase requests with line items and approval flow.

---

## Entity Schemas

### Asset (NEW)
```python
id: UUID PK
name: String(255)                    # Required
category: String(100)                # e.g. laptop, phone, furniture, vehicle
serial_number: String(255)           # Nullable, unique within workspace
purchase_date: Date                  # Nullable
value: Numeric(12,2)                 # Nullable (purchase value)
status: String(20)                   # available / assigned / maintenance / retired
location: String(255)               # Nullable
workspace_id: UUID FK(workspaces.id) # Required, indexed
# + TimestampMixin
```

### AssetAssignment (NEW)
```python
id: UUID PK
asset_id: UUID FK(assets.id, CASCADE)       # Required, indexed
employee_id: UUID FK(employees.id)           # Required, indexed
assigned_date: Date                          # Required
returned_date: Date                          # Nullable
condition_on_assign: String(100)             # e.g. new, good, fair
condition_on_return: String(100)             # Nullable
notes: String(500)                           # Nullable
workspace_id: UUID FK(workspaces.id)         # Required, indexed
# + TimestampMixin
```

### PurchaseRequest (NEW)
```python
id: UUID PK
requester_id: UUID FK(users.id)              # Required
title: String(255)                           # Required
description: String(500)                     # Nullable
estimated_cost: Numeric(12,2)                # Nullable
status: String(20)                           # draft / submitted / approved / rejected / completed
approved_by_id: UUID FK(users.id)            # Nullable
workspace_id: UUID FK(workspaces.id)         # Required, indexed
# + TimestampMixin
```

### PurchaseItem (NEW)
```python
id: UUID PK
request_id: UUID FK(purchase_requests.id, CASCADE)  # Required, indexed
item_name: String(255)                               # Required
quantity: Integer                                    # Default 1
unit_price: Numeric(12,2)                            # Required
notes: String(255)                                   # Nullable
workspace_id: UUID FK(workspaces.id)                 # Required, indexed
# + TimestampMixin
```

---

## Backend Implementation

### 1. Models (4 files)
**Create:**
- `backend/app/modules/hrm/models/asset.py`
- `backend/app/modules/hrm/models/asset_assignment.py`
- `backend/app/modules/hrm/models/purchase_request.py`
- `backend/app/modules/hrm/models/purchase_item.py`

### 2. Register models
**Modify:** `backend/app/modules/hrm/models/__init__.py`

### 3. Schemas (4 files)
**Create:**
- `backend/app/modules/hrm/schemas/asset.py`
  - Create: name, category, serial_number?, purchase_date?, value?, status?, location?
  - Update: all optional
  - Response: all fields
- `backend/app/modules/hrm/schemas/asset_assignment.py`
  - Create: asset_id, employee_id, assigned_date, condition_on_assign, notes?
  - Update: returned_date?, condition_on_return?, notes?
  - Response: all fields
- `backend/app/modules/hrm/schemas/purchase_request.py`
  - Create: title, description?, estimated_cost?
  - Update: title?, description?, estimated_cost?, status?
  - Response: all fields + items (nested list)
- `backend/app/modules/hrm/schemas/purchase_item.py`
  - Create: request_id, item_name, quantity?, unit_price, notes?
  - Update: item_name?, quantity?, unit_price?, notes?
  - Response: all fields

### 4. Services (4 files)
**Create:**
- `backend/app/modules/hrm/services/asset.py`
  - Standard CRUD + filter by category, status, search by name/serial_number
- `backend/app/modules/hrm/services/asset_assignment.py`
  - Standard CRUD + filter by asset_id, employee_id
  - `assign_asset(db, workspace_id, data)` — create assignment + set asset status="assigned"
  - `return_asset(db, assignment_id, workspace_id, condition, notes?)` — set returned_date + asset status="available"
- `backend/app/modules/hrm/services/purchase_request.py`
  - Standard CRUD + filter by status, requester_id
  - `submit_request(db, id, workspace_id)` — draft -> submitted
  - `approve_request(db, id, workspace_id, approved_by_id)` — submitted -> approved
  - `reject_request(db, id, workspace_id)` — submitted -> rejected
  - `complete_request(db, id, workspace_id)` — approved -> completed
- `backend/app/modules/hrm/services/purchase_item.py`
  - Standard CRUD + filter by request_id

### 5. Routers (4 files)
**Create:**
- `backend/app/modules/hrm/routers/assets.py`
  - CRUD at `/workspaces/{workspace_id}/assets`
- `backend/app/modules/hrm/routers/asset_assignments.py`
  - CRUD at `/workspaces/{workspace_id}/asset-assignments`
  - POST `/{id}/return` (member) — return asset action
- `backend/app/modules/hrm/routers/purchase_requests.py`
  - CRUD at `/workspaces/{workspace_id}/purchase-requests`
  - POST `/{id}/submit`, `/{id}/approve`, `/{id}/reject`, `/{id}/complete`
- `backend/app/modules/hrm/routers/purchase_items.py`
  - CRUD at `/workspaces/{workspace_id}/purchase-items`

### 6. Register routers
**Modify:** `backend/app/modules/hrm/router.py`

### 7. Migration
**Create:** `backend/alembic/versions/0015_add_assets_procurement_tables.py`

---

## Frontend Implementation

### 8. Hooks (4 files)
**Create:**
- `frontend/src/modules/hrm/features/assets/hooks/use-assets.ts`
- `frontend/src/modules/hrm/features/assets/hooks/use-asset-assignments.ts`
- `frontend/src/modules/hrm/features/procurement/hooks/use-purchase-requests.ts`
- `frontend/src/modules/hrm/features/procurement/hooks/use-purchase-items.ts`

### 9. Components
**Create:**
- `frontend/src/modules/hrm/features/assets/components/asset-form-dialog.tsx`
  - Fields: name, category (select), serial_number, purchase_date, value, status, location
- `frontend/src/modules/hrm/features/assets/components/asset-assign-dialog.tsx`
  - Fields: employee (select), assigned_date, condition_on_assign (select)
- `frontend/src/modules/hrm/features/assets/components/asset-return-dialog.tsx`
  - Fields: condition_on_return (select), notes
- `frontend/src/modules/hrm/features/assets/components/assignment-history-table.tsx`
  - Table: employee, assigned_date, returned_date, condition
- `frontend/src/modules/hrm/features/procurement/components/purchase-request-form-dialog.tsx`
  - Fields: title, description, estimated_cost
  - Inline purchase items: item_name, quantity, unit_price (add/remove rows)
- `frontend/src/modules/hrm/features/procurement/components/purchase-status-badge.tsx`
  - Color-coded status badge

### 10. Pages
**Create:**
- `frontend/src/modules/hrm/features/assets/pages/assets-list.tsx`
  - Table: name, category, serial_number, status, current assignee
  - Filter by category, status
  - Click row to see assignment history
- `frontend/src/modules/hrm/features/procurement/pages/procurement-list.tsx`
  - Table: title, requester, estimated_cost, status, item count
  - Action buttons: submit/approve/reject/complete
  - Expandable to show purchase items

### 11. Routes + Sidebar
**Modify:** `frontend/src/app/router.tsx`
- Routes: `/hrm/assets`, `/hrm/procurement`

**Modify:** `frontend/src/shared/components/shell/sidebar.tsx`
- NavItems: Assets (Monitor or Box icon), Procurement (ShoppingCart icon)

---

## Files Summary

### Create (backend: 13, frontend: 12)
- 4 models, 4 schemas, 4 services, 4 routers, 1 migration
- 4 hooks, 6 components, 2 pages

### Modify
- `backend/app/modules/hrm/models/__init__.py`
- `backend/app/modules/hrm/router.py`
- `frontend/src/app/router.tsx`
- `frontend/src/shared/components/shell/sidebar.tsx`

---

## TODO
- [ ] Create 4 models
- [ ] Register models
- [ ] Create 4 schemas
- [ ] Create 4 services with action endpoints
- [ ] Create 4 routers
- [ ] Register routers
- [ ] Create migration
- [ ] Create 4 hooks
- [ ] Create 6 components
- [ ] Create assets list page
- [ ] Create procurement list page
- [ ] Add routes and sidebar

## Success Criteria
- Asset CRUD with status tracking (available/assigned/maintenance/retired)
- Asset assignment auto-updates asset status
- Return asset action sets returned_date and resets asset to available
- Purchase request workflow: draft -> submitted -> approved/rejected -> completed
- Purchase items nested under request
- Both pages accessible from sidebar

## Risk Assessment
- Asset serial_number uniqueness within workspace — add partial unique index
- Purchase request with nested items: create items after request creation (two-step) or batch create
