# Phase 1: Foundation — HR RBAC, Status Machines, Employee Model

## Context Links
- Gap analysis: `plans/reports/gap-analysis-260309-1140-hrm-sop-compliance.md`
- Existing RBAC: `backend/app/dependencies/rbac.py`
- Employee model: `backend/app/modules/hrm/models/employee.py`
- Workspace model: `backend/app/models/workspace.py`

## Overview
- **Priority:** P1 — blocks all other phases
- **Status:** COMPLETE
- **Effort:** 10h
- **Description:** Add HR-specific roles, expand Employee model with personal info + status, add status enums to entities missing them, create `require_hrm_role()` dependency.

## Completion Summary (2026-03-09)
All Phase 1 deliverables successfully implemented:
- `hrm_role` column added to `WorkspaceMembership` in migration 0019
- `require_hrm_role()` dependency created in `backend/app/modules/hrm/dependencies/rbac.py`
- Employee model expanded with 7 fields: DOB, address, national_id, bank_account, bank_name, phone, employee_status
- Department model includes `code` column (workspace-scoped unique)
- Offer model includes `contract_type` and `benefits` JSONB columns
- RecruitmentRequest includes `salary_range_min`, `salary_range_max` with `draft` default status
- Status transition validation helper pattern established
- Migration 0019 applied successfully

## Key Insights
- Current RBAC: `WorkspaceMembership.role` = admin/member/guest. Rank-based comparison in `rbac.py`.
- CRM uses inline status dicts in service files (e.g., `lead.py` validates transitions). Follow same pattern.
- Employee model missing 6 fields: DOB, address, national_id, bank_account_number, bank_name, phone, employee_status.
- 5 models need status enum expansion: RecruitmentRequest, PayrollRecord, TrainingProgram, Resignation, Offer.

## Architecture Decisions

### HR Roles: Column on WorkspaceMembership
Add `hrm_role` column (nullable VARCHAR(30)) to `workspace_memberships` table. Values: `hr_admin`, `hr_manager`, `line_manager`, `ceo`, `null` (no HR role).

**Why not a separate table?** KISS — one column, one query, extends existing membership check. Same row already loaded in `_get_workspace_membership()`.

```python
# workspace.py — add column
class WorkspaceMembership(Base, TimestampMixin):
    ...
    hrm_role: Mapped[str | None] = mapped_column(String(30), nullable=True)
```

### Dependency: `require_hrm_role()`
New file `backend/app/modules/hrm/dependencies/rbac.py`:

```python
HRM_ROLE_RANK = {"line_manager": 1, "hr_manager": 2, "hr_admin": 3, "ceo": 4}

def require_hrm_role(min_role: str) -> Callable:
    async def dep(
        workspace_id: uuid.UUID = Path(...),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        membership = await _get_workspace_membership(workspace_id, current_user, db)
        # Workspace admins bypass HRM role check
        if membership.role == "admin":
            return current_user
        user_rank = HRM_ROLE_RANK.get(membership.hrm_role or "", 0)
        if user_rank < HRM_ROLE_RANK.get(min_role, 0):
            raise HTTPException(403, "Insufficient HRM role")
        return current_user
    return dep
```

### Status Transition Pattern
Follow CRM inline-dict pattern. Each service defines valid transitions:

```python
# In recruitment_request.py service
RECRUITMENT_TRANSITIONS = {
    "draft": ["submitted"],
    "submitted": ["hr_approved", "rejected"],
    "hr_approved": ["ceo_approved", "rejected"],
    "ceo_approved": [],
    "rejected": [],
}

def _validate_transition(current: str, target: str, transitions: dict) -> None:
    if target not in transitions.get(current, []):
        raise HTTPException(400, f"Cannot transition from '{current}' to '{target}'")
```

## Related Code Files

### Files to Modify
| File | Change |
|------|--------|
| `backend/app/models/workspace.py` | Add `hrm_role` column to WorkspaceMembership |
| `backend/app/modules/hrm/models/employee.py` | Add 7 personal info fields + `employee_status` |
| `backend/app/modules/hrm/schemas/employee.py` | Add new fields to Create/Update/Response schemas |
| `backend/app/modules/hrm/models/recruitment_request.py` | Change status default from `open` to `draft` |
| `backend/app/modules/hrm/models/offer.py` | Add `contract_type`, `benefits` columns |
| `backend/app/modules/hrm/schemas/offer.py` | Add new fields to schemas |
| `backend/app/modules/hrm/models/resignation.py` | Expand status values (add handover, exit_interview, completed) |
| `backend/app/modules/hrm/models/department.py` | Add `code` column |
| `backend/app/modules/hrm/schemas/department.py` | Add `code` to schemas |
| `backend/app/modules/hrm/models/__init__.py` | No change needed (all models already imported) |

### Files to Create
| File | Purpose |
|------|---------|
| `backend/app/modules/hrm/dependencies/__init__.py` | Package init |
| `backend/app/modules/hrm/dependencies/rbac.py` | `require_hrm_role()` dependency |
| `backend/alembic/versions/0019_hrm_phase1_rbac_employee_statuses.py` | Migration |

## Implementation Steps

### Step 1: Add `hrm_role` to WorkspaceMembership
In `backend/app/models/workspace.py`, add to `WorkspaceMembership`:
```python
hrm_role: Mapped[str | None] = mapped_column(String(30), nullable=True)
```

### Step 2: Create HRM RBAC dependency
Create `backend/app/modules/hrm/dependencies/rbac.py`:
```python
import uuid
from typing import Callable
from fastapi import Depends, HTTPException, Path, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.workspace import WorkspaceMembership

HRM_ROLE_RANK = {"line_manager": 1, "hr_manager": 2, "hr_admin": 3, "ceo": 4}

async def _get_hrm_membership(
    workspace_id: uuid.UUID, user: User, db: AsyncSession
) -> WorkspaceMembership:
    membership = await db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == workspace_id,
            WorkspaceMembership.user_id == user.id,
        )
    )
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a workspace member")
    return membership

def require_hrm_role(min_role: str) -> Callable:
    """Require HRM-specific role. Workspace admins bypass."""
    async def dep(
        workspace_id: uuid.UUID = Path(...),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        membership = await _get_hrm_membership(workspace_id, current_user, db)
        if membership.role == "admin":
            return current_user
        user_rank = HRM_ROLE_RANK.get(membership.hrm_role or "", 0)
        if user_rank < HRM_ROLE_RANK.get(min_role, 0):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires HRM role: {min_role} or higher",
            )
        return current_user
    return dep
```

### Step 3: Expand Employee model
Add to `backend/app/modules/hrm/models/employee.py`:
```python
from sqlalchemy import Date, String, Text

date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
address: Mapped[str | None] = mapped_column(Text, nullable=True)
national_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
bank_account_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
bank_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
employee_status: Mapped[str] = mapped_column(
    String(20), default="active", server_default="active"
)  # active / inactive / probation
```

### Step 4: Update Employee schemas
In `backend/app/modules/hrm/schemas/employee.py`, add corresponding optional fields to Create/Update/Response.

### Step 5: Add Department `code` column
In `backend/app/modules/hrm/models/department.py`:
```python
code: Mapped[str | None] = mapped_column(String(20), nullable=True, unique=True)
```

### Step 6: Expand Offer model
In `backend/app/modules/hrm/models/offer.py`, add:
```python
contract_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
# e.g., "full_time", "part_time", "contractor", "internship"
benefits: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
```

### Step 7: Update RecruitmentRequest default status
In `backend/app/modules/hrm/models/recruitment_request.py`:
Change `default="open"` to `default="draft"`, add `server_default="draft"`.
Add `salary_range_min` and `salary_range_max` columns (Numeric(12,2), nullable).

### Step 8: Write migration
Single migration covering: `hrm_role` on workspace_memberships, 7 new Employee columns, department `code`, offer `contract_type`+`benefits`, recruitment_request `salary_range_*` + status default change.

### Step 9: Create `_validate_transition()` helper
Create `backend/app/modules/hrm/services/status_transitions.py` (~30 lines):
```python
from fastapi import HTTPException, status

def validate_transition(
    current: str, target: str, transitions: dict[str, list[str]], entity: str = "entity"
) -> None:
    allowed = transitions.get(current, [])
    if target not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{entity}: cannot transition from '{current}' to '{target}'. Allowed: {allowed}",
        )
```

## TODO Checklist

- [x] Add `hrm_role` column to `WorkspaceMembership` model
- [x] Create `backend/app/modules/hrm/dependencies/__init__.py`
- [x] Create `backend/app/modules/hrm/dependencies/rbac.py` with `require_hrm_role()`
- [x] Add 7 fields to Employee model (DOB, address, national_id, bank_account, bank_name, phone, employee_status)
- [x] Update Employee schemas (Create, Update, Response)
- [x] Add `code` column to Department model + schemas
- [x] Add `contract_type`, `benefits` to Offer model + schemas
- [x] Add `salary_range_min`, `salary_range_max` to RecruitmentRequest model + schemas
- [x] Change RecruitmentRequest default status from `open` to `draft`
- [x] Create `status_transitions.py` helper
- [x] Write Alembic migration `0019_hrm_phase1_rbac_employee_statuses.py`
- [x] Run migration, verify with `make test`

## Success Criteria
1. `require_hrm_role("hr_manager")` dependency blocks users without sufficient HRM role
2. Workspace admins bypass HRM role checks
3. Employee model has all 7 personal info fields + `employee_status`
4. Department has `code` field
5. Offer has `contract_type` and `benefits` fields
6. RecruitmentRequest has salary range fields and `draft` default status
7. `validate_transition()` helper correctly rejects invalid status changes
8. Migration applies cleanly, existing data unaffected (all new columns nullable or have defaults)

## Risk Assessment
| Risk | Mitigation |
|------|------------|
| `hrm_role` column on shared `WorkspaceMembership` — non-HRM modules load unused column | Nullable, tiny overhead. Alternative (separate table) adds JOIN cost to every HRM request |
| Status default change on RecruitmentRequest breaks existing records | Only change the default for new records. Existing `open` records remain valid. Phase 2 will handle transition from `open` -> new statuses |
| Migration conflicts with pending PMS sprint migration | Run `make migrate` after merging PMS branch first |
