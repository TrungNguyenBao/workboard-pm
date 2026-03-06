---
phase: 1A
title: "Org Structure Enhancement"
status: pending
priority: P1
effort: 4h
depends_on: []
---

# Phase 1A — Org Structure Enhancement

## Context
- [Brainstorm Report](../reports/brainstorm-260304-1818-hrm-module-update.md)
- Existing: `backend/app/modules/hrm/models/department.py`
- Existing: `backend/app/modules/hrm/schemas/department.py`
- Existing: `backend/app/modules/hrm/services/department.py`
- Existing: `backend/app/modules/hrm/routers/departments.py`
- Existing: `frontend/src/modules/hrm/features/departments/`

## Overview
Add `positions` table. Alter `departments` to support hierarchy (parent_department_id) and manager assignment (manager_id). Expose org tree endpoint using recursive CTE.

## Key Insights
- Department hierarchy via self-referential FK is simplest approach; recursive CTE for tree query
- No need for materialized path or nested sets — depth is shallow (typically 3-5 levels)
- headcount_limit=0 means unlimited

---

## Entity Schemas

### Position (NEW)
```python
# positions table
id: UUID PK
title: String(255)           # Required
department_id: UUID FK(departments.id)  # Required
headcount_limit: Integer     # Default 0 (unlimited)
description: String(500)     # Nullable
is_active: Boolean           # Default True
workspace_id: UUID FK(workspaces.id)    # Required, indexed
# + TimestampMixin (created_at, updated_at)
```

### Department (ALTER)
```python
# Add columns to existing departments table
parent_department_id: UUID FK(departments.id)  # Nullable, self-ref
manager_id: UUID FK(employees.id)              # Nullable
```

---

## Backend Implementation

### 1. Model: Position
**Create:** `backend/app/modules/hrm/models/position.py`
```python
import uuid
from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin

class Position(Base, TimestampMixin):
    __tablename__ = "positions"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255))
    department_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("departments.id"), index=True
    )
    headcount_limit: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id"), index=True
    )
    department: Mapped["Department"] = relationship()
    workspace: Mapped["Workspace"] = relationship()
```

### 2. Model: Alter Department
**Modify:** `backend/app/modules/hrm/models/department.py`
- Add `parent_department_id` column: `Mapped[uuid.UUID | None]` with self-ref FK
- Add `manager_id` column: `Mapped[uuid.UUID | None]` with FK to employees.id
- Add relationships: `parent`, `children`, `manager`

### 3. Register model in `__init__`
**Modify:** `backend/app/modules/hrm/models/__init__.py`
- Add `from app.modules.hrm.models.position import Position`

### 4. Schema: Position
**Create:** `backend/app/modules/hrm/schemas/position.py`
```
PositionCreate: title(str), department_id(UUID), headcount_limit(int=0), description(str|None), is_active(bool=True)
PositionUpdate: title(str|None), department_id(UUID|None), headcount_limit(int|None), description(str|None), is_active(bool|None)
PositionResponse: id, title, department_id, headcount_limit, description, is_active, workspace_id + from_attributes
```

### 5. Schema: Update Department schemas
**Modify:** `backend/app/modules/hrm/schemas/department.py`
- DepartmentCreate: add `parent_department_id: uuid.UUID | None = None`, `manager_id: uuid.UUID | None = None`
- DepartmentUpdate: add same fields
- DepartmentResponse: add same fields
- NEW `DepartmentTreeNode`: id, name, description, parent_department_id, manager_id, children: list[DepartmentTreeNode], employee_count: int

### 6. Service: Position
**Create:** `backend/app/modules/hrm/services/position.py`
- `create_position(db, workspace_id, data)` -> Position
- `list_positions(db, workspace_id, department_id?, search?, page, page_size)` -> tuple[list, int]
- `get_position(db, position_id, workspace_id)` -> Position
- `update_position(db, position_id, workspace_id, data)` -> Position
- `delete_position(db, position_id, workspace_id)` -> None

### 7. Service: Org tree + headcount
**Create:** `backend/app/modules/hrm/services/org_tree.py`
- `get_org_tree(db, workspace_id)` -> list[DepartmentTreeNode]
  - Use recursive CTE: `WITH RECURSIVE dept_tree AS (...)`
  - Build tree in Python from flat list (root = parent_department_id IS NULL)
- `get_headcount_summary(db, workspace_id)` -> list[dict]
  - For each department: department_id, department_name, total_positions, filled_positions, open_positions

### 8. Router: Position
**Create:** `backend/app/modules/hrm/routers/positions.py`
- POST `/workspaces/{workspace_id}/positions` (member)
- GET `/workspaces/{workspace_id}/positions` (guest) — paginated, filter by department_id
- GET `/workspaces/{workspace_id}/positions/{position_id}` (guest)
- PATCH `/workspaces/{workspace_id}/positions/{position_id}` (member)
- DELETE `/workspaces/{workspace_id}/positions/{position_id}` (admin)

### 9. Router: Org tree endpoints
**Modify:** `backend/app/modules/hrm/routers/departments.py`
- GET `/workspaces/{workspace_id}/departments/tree` (guest) — org tree
- GET `/workspaces/{workspace_id}/departments/headcount` (guest) — headcount summary

### 10. Register router
**Modify:** `backend/app/modules/hrm/router.py`
- Add `from app.modules.hrm.routers import positions`
- Add `hrm_router.include_router(positions.router)`

### 11. Migration
**Create:** `backend/alembic/versions/0008_add_positions_alter_departments.py`
- Create `positions` table
- Add `parent_department_id` column to departments (FK self-ref)
- Add `manager_id` column to departments (FK employees)
- Add index on positions.department_id, positions.workspace_id

---

## Frontend Implementation

### 12. Hook: Positions
**Create:** `frontend/src/modules/hrm/features/positions/hooks/use-positions.ts`
- Interface: Position { id, title, department_id, headcount_limit, description, is_active, workspace_id }
- `usePositions(wsId, filters)` — query
- `useCreatePosition(wsId)` — mutation
- `useUpdatePosition(wsId)` — mutation
- `useDeletePosition(wsId)` — mutation

### 13. Hook: Org tree
**Create:** `frontend/src/modules/hrm/features/departments/hooks/use-org-tree.ts`
- `useOrgTree(wsId)` — fetches /departments/tree
- `useHeadcount(wsId)` — fetches /departments/headcount

### 14. Component: Position form dialog
**Create:** `frontend/src/modules/hrm/features/positions/components/position-form-dialog.tsx`
- Form fields: title, department (select), headcount_limit, description, is_active toggle
- Reuse pattern from department-form-dialog.tsx

### 15. Page: Positions list
**Create:** `frontend/src/modules/hrm/features/positions/pages/positions-list.tsx`
- Table: title, department name, headcount, status
- Filter by department
- Reuse HrmDataTable, HrmPageHeader, HrmPagination

### 16. Component: Org chart tree
**Create:** `frontend/src/modules/hrm/features/departments/components/org-chart-tree.tsx`
- Recursive tree rendering of departments
- Show manager name, employee count per dept
- Collapsible nodes

### 17. Update Department form dialog
**Modify:** `frontend/src/modules/hrm/features/departments/components/department-form-dialog.tsx`
- Add parent department select (exclude self from options)
- Add manager select (employee dropdown)

### 18. Update Department hook
**Modify:** `frontend/src/modules/hrm/features/departments/hooks/use-departments.ts`
- Update Department interface: add parent_department_id, manager_id

### 19. Routes + Sidebar
**Modify:** `frontend/src/app/router.tsx`
- Add lazy import: `HrmPositionsPage`
- Add route: `/hrm/positions`

**Modify:** `frontend/src/shared/components/shell/sidebar.tsx`
- Add NavItem for Positions (Briefcase icon or similar)

---

## Files Summary

### Create
- `backend/app/modules/hrm/models/position.py`
- `backend/app/modules/hrm/schemas/position.py`
- `backend/app/modules/hrm/services/position.py`
- `backend/app/modules/hrm/services/org_tree.py`
- `backend/app/modules/hrm/routers/positions.py`
- `backend/alembic/versions/0008_add_positions_alter_departments.py`
- `frontend/src/modules/hrm/features/positions/hooks/use-positions.ts`
- `frontend/src/modules/hrm/features/positions/components/position-form-dialog.tsx`
- `frontend/src/modules/hrm/features/positions/pages/positions-list.tsx`
- `frontend/src/modules/hrm/features/departments/hooks/use-org-tree.ts`
- `frontend/src/modules/hrm/features/departments/components/org-chart-tree.tsx`

### Modify
- `backend/app/modules/hrm/models/department.py`
- `backend/app/modules/hrm/models/__init__.py`
- `backend/app/modules/hrm/schemas/department.py`
- `backend/app/modules/hrm/services/department.py` (add manager/parent filters)
- `backend/app/modules/hrm/routers/departments.py`
- `backend/app/modules/hrm/router.py`
- `frontend/src/modules/hrm/features/departments/hooks/use-departments.ts`
- `frontend/src/modules/hrm/features/departments/components/department-form-dialog.tsx`
- `frontend/src/app/router.tsx`
- `frontend/src/shared/components/shell/sidebar.tsx`

---

## TODO
- [ ] Create Position model
- [ ] Alter Department model (parent_department_id, manager_id)
- [ ] Register Position in models/__init__.py
- [ ] Create Position schemas (Create/Update/Response)
- [ ] Update Department schemas (add hierarchy fields + DepartmentTreeNode)
- [ ] Create Position service (CRUD)
- [ ] Create org_tree service (recursive CTE + headcount)
- [ ] Create Position router
- [ ] Add tree/headcount endpoints to departments router
- [ ] Register positions router in router.py
- [ ] Create Alembic migration
- [ ] Create positions hook (frontend)
- [ ] Create org tree hook (frontend)
- [ ] Create position form dialog
- [ ] Create positions list page
- [ ] Create org chart tree component
- [ ] Update department form dialog (parent + manager selects)
- [ ] Update department hook (interface)
- [ ] Add routes + sidebar nav items

## Success Criteria
- Positions CRUD fully working via API
- Department hierarchy stored and queryable via /tree endpoint
- Org chart renders tree with collapse/expand
- Headcount summary shows filled vs open positions per dept
- All new routes accessible from sidebar

## Risk Assessment
- Recursive CTE performance on large org trees — mitigated by shallow depth (3-5 levels)
- Circular parent references — add validation in service to prevent self-referential loops
