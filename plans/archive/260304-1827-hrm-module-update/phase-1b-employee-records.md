---
phase: 1B
title: "Employee Records Enhancement"
status: pending
priority: P1
effort: 5h
depends_on: []
---

# Phase 1B — Employee Records Enhancement

## Context
- [Brainstorm Report](../reports/brainstorm-260304-1818-hrm-module-update.md)
- Existing: `backend/app/modules/hrm/models/employee.py`
- Existing: `backend/app/modules/hrm/services/employee.py`
- Existing: `frontend/src/modules/hrm/features/employees/`

## Overview
Add `contracts` and `salary_history` tables. Contracts track employment terms (probation/fixed/indefinite) with salary info. Salary history auto-logs on salary changes. Build employee detail page with tabs.

---

## Entity Schemas

### Contract (NEW)
```python
id: UUID PK
employee_id: UUID FK(employees.id, CASCADE)  # Required, indexed
contract_type: String(50)    # probation / fixed_term / indefinite
start_date: Date             # Required
end_date: Date               # Nullable (indefinite)
base_salary: Numeric(12,2)   # Required
allowances: JSONB            # Nullable
status: String(20)           # active / expired / terminated
file_url: String(500)        # Nullable
notes: String(500)           # Nullable
workspace_id: UUID FK(workspaces.id)  # Required, indexed
# + TimestampMixin
```

### SalaryHistory (NEW)
```python
id: UUID PK
employee_id: UUID FK(employees.id, CASCADE)  # Required, indexed
effective_date: Date          # Required
previous_amount: Numeric(12,2) # Required
new_amount: Numeric(12,2)     # Required
reason: String(255)           # Required
approved_by_id: UUID FK(users.id)  # Nullable
workspace_id: UUID FK(workspaces.id)  # Required, indexed
# + TimestampMixin
```

---

## Backend Implementation

### 1. Model: Contract
**Create:** `backend/app/modules/hrm/models/contract.py`
```python
class Contract(Base, TimestampMixin):
    __tablename__ = "contracts"
    id: Mapped[uuid.UUID] PK
    employee_id: Mapped[uuid.UUID] FK(employees.id, CASCADE), indexed
    contract_type: Mapped[str] String(50)
    start_date: Mapped[date] Date
    end_date: Mapped[date | None] Date, nullable
    base_salary: Mapped[float] Numeric(12,2)
    allowances: Mapped[dict | None] JSONB, nullable
    status: Mapped[str] String(20), default="active"
    file_url: Mapped[str | None] String(500), nullable
    notes: Mapped[str | None] String(500), nullable
    workspace_id: Mapped[uuid.UUID] FK(workspaces.id), indexed
    # relationships: employee, workspace
```

### 2. Model: SalaryHistory
**Create:** `backend/app/modules/hrm/models/salary_history.py`
```python
class SalaryHistory(Base, TimestampMixin):
    __tablename__ = "salary_history"
    id: Mapped[uuid.UUID] PK
    employee_id: Mapped[uuid.UUID] FK(employees.id, CASCADE), indexed
    effective_date: Mapped[date] Date
    previous_amount: Mapped[float] Numeric(12,2)
    new_amount: Mapped[float] Numeric(12,2)
    reason: Mapped[str] String(255)
    approved_by_id: Mapped[uuid.UUID | None] FK(users.id), nullable
    workspace_id: Mapped[uuid.UUID] FK(workspaces.id), indexed
    # relationships: employee, approved_by, workspace
```

### 3. Register models
**Modify:** `backend/app/modules/hrm/models/__init__.py`
- Add Contract, SalaryHistory imports

### 4. Schema: Contract
**Create:** `backend/app/modules/hrm/schemas/contract.py`
```
ContractCreate: employee_id, contract_type(validated), start_date, end_date?, base_salary(ge=0), allowances?, file_url?, notes?
ContractUpdate: contract_type?, start_date?, end_date?, base_salary?, allowances?, status?, file_url?, notes?
ContractResponse: all fields + from_attributes
```
- Validate contract_type in {"probation", "fixed_term", "indefinite"}
- Validate status in {"active", "expired", "terminated"}

### 5. Schema: SalaryHistory
**Create:** `backend/app/modules/hrm/schemas/salary_history.py`
```
SalaryHistoryCreate: employee_id, effective_date, previous_amount(ge=0), new_amount(ge=0), reason, approved_by_id?
SalaryHistoryResponse: all fields + from_attributes
```
- No Update schema — salary history is append-only (immutable log)

### 6. Service: Contract
**Create:** `backend/app/modules/hrm/services/contract.py`
- `create_contract(db, workspace_id, data)` -> Contract
- `list_contracts(db, workspace_id, employee_id?, status?, page, page_size)` -> tuple[list, int]
- `get_contract(db, contract_id, workspace_id)` -> Contract
- `update_contract(db, contract_id, workspace_id, data)` -> Contract
  - If base_salary changes: auto-create SalaryHistory record
- `delete_contract(db, contract_id, workspace_id)` -> None

### 7. Service: SalaryHistory
**Create:** `backend/app/modules/hrm/services/salary_history.py`
- `create_salary_history(db, workspace_id, data)` -> SalaryHistory
- `list_salary_history(db, workspace_id, employee_id, page, page_size)` -> tuple[list, int]
  - Order by effective_date DESC

### 8. Service: Employee detail (enhanced)
**Modify:** `backend/app/modules/hrm/services/employee.py`
- Add `get_employee_detail(db, employee_id, workspace_id)` -> dict
  - Returns employee + active contract + leave summary + recent salary history
  - Uses joinedload/selectinload for eager loading

### 9. Schema: Employee detail response
**Modify:** `backend/app/modules/hrm/schemas/employee.py`
- Add `EmployeeDetailResponse`: extends EmployeeResponse with:
  - active_contract: ContractResponse | None
  - recent_salary_changes: list[SalaryHistoryResponse]
  - leave_balance: dict (type_name -> {total, used, remaining})

### 10. Router: Contract
**Create:** `backend/app/modules/hrm/routers/contracts.py`
- POST `/workspaces/{workspace_id}/contracts` (member)
- GET `/workspaces/{workspace_id}/contracts` (guest) — paginated, filter by employee_id, status
- GET `/workspaces/{workspace_id}/contracts/{contract_id}` (guest)
- PATCH `/workspaces/{workspace_id}/contracts/{contract_id}` (member)
- DELETE `/workspaces/{workspace_id}/contracts/{contract_id}` (admin)

### 11. Router: SalaryHistory
**Create:** `backend/app/modules/hrm/routers/salary_history.py`
- GET `/workspaces/{workspace_id}/salary-history` (member) — paginated, filter by employee_id
- POST `/workspaces/{workspace_id}/salary-history` (admin) — manual entry

### 12. Router: Employee detail
**Modify:** `backend/app/modules/hrm/routers/employees.py`
- Add GET `/workspaces/{workspace_id}/employees/{employee_id}/detail` (guest)
  - Returns EmployeeDetailResponse

### 13. Register routers
**Modify:** `backend/app/modules/hrm/router.py`
- Add contracts, salary_history routers

### 14. Migration
**Create:** `backend/alembic/versions/0009_add_contracts_salary_history.py`
- Create `contracts` table with indexes
- Create `salary_history` table with indexes

---

## Frontend Implementation

### 15. Hook: Contracts
**Create:** `frontend/src/modules/hrm/features/employees/hooks/use-contracts.ts`
- Interface: Contract { id, employee_id, contract_type, start_date, end_date, base_salary, allowances, status, file_url, notes, workspace_id }
- `useContracts(wsId, employeeId?)` — query
- `useCreateContract(wsId)` — mutation
- `useUpdateContract(wsId)` — mutation
- `useDeleteContract(wsId)` — mutation

### 16. Hook: SalaryHistory
**Create:** `frontend/src/modules/hrm/features/employees/hooks/use-salary-history.ts`
- `useSalaryHistory(wsId, employeeId)` — query (read-only in UI)

### 17. Hook: Employee detail
**Modify:** `frontend/src/modules/hrm/features/employees/hooks/use-employees.ts`
- Add `useEmployeeDetail(wsId, employeeId)` — fetches /employees/{id}/detail

### 18. Component: Contract form dialog
**Create:** `frontend/src/modules/hrm/features/employees/components/contract-form-dialog.tsx`
- Fields: contract_type (select), start_date, end_date, base_salary, allowances (JSON editor or key-value), file_url, notes
- Status shown in edit mode only

### 19. Component: Employee contracts tab
**Create:** `frontend/src/modules/hrm/features/employees/components/employee-contracts-tab.tsx`
- Table of contracts for employee
- Status badge (active=green, expired=yellow, terminated=red)
- Add contract button

### 20. Component: Employee salary history tab
**Create:** `frontend/src/modules/hrm/features/employees/components/employee-salary-tab.tsx`
- Table: effective_date, previous_amount, new_amount, reason, approved_by
- Read-only timeline view

### 21. Page: Employee detail
**Create:** `frontend/src/modules/hrm/features/employees/pages/employee-detail.tsx`
- Tabs: Info | Contracts | Salary History | Leave
- Info tab: employee fields (name, email, department, position, hire_date)
- Contracts tab: employee-contracts-tab component
- Salary tab: employee-salary-tab component
- Leave tab: filtered leave requests for this employee (reuse existing hook)

### 22. Routes
**Modify:** `frontend/src/app/router.tsx`
- Add lazy import: `HrmEmployeeDetailPage`
- Add route: `/hrm/employees/:employeeId`

### 23. Link from employees list
**Modify:** `frontend/src/modules/hrm/features/employees/pages/employees-list.tsx`
- Add row click handler -> navigate to `/hrm/employees/${id}`

---

## Files Summary

### Create
- `backend/app/modules/hrm/models/contract.py`
- `backend/app/modules/hrm/models/salary_history.py`
- `backend/app/modules/hrm/schemas/contract.py`
- `backend/app/modules/hrm/schemas/salary_history.py`
- `backend/app/modules/hrm/services/contract.py`
- `backend/app/modules/hrm/services/salary_history.py`
- `backend/app/modules/hrm/routers/contracts.py`
- `backend/app/modules/hrm/routers/salary_history.py`
- `backend/alembic/versions/0009_add_contracts_salary_history.py`
- `frontend/src/modules/hrm/features/employees/hooks/use-contracts.ts`
- `frontend/src/modules/hrm/features/employees/hooks/use-salary-history.ts`
- `frontend/src/modules/hrm/features/employees/components/contract-form-dialog.tsx`
- `frontend/src/modules/hrm/features/employees/components/employee-contracts-tab.tsx`
- `frontend/src/modules/hrm/features/employees/components/employee-salary-tab.tsx`
- `frontend/src/modules/hrm/features/employees/pages/employee-detail.tsx`

### Modify
- `backend/app/modules/hrm/models/__init__.py`
- `backend/app/modules/hrm/services/employee.py`
- `backend/app/modules/hrm/schemas/employee.py`
- `backend/app/modules/hrm/routers/employees.py`
- `backend/app/modules/hrm/router.py`
- `frontend/src/modules/hrm/features/employees/hooks/use-employees.ts`
- `frontend/src/modules/hrm/features/employees/pages/employees-list.tsx`
- `frontend/src/app/router.tsx`

---

## TODO
- [ ] Create Contract model
- [ ] Create SalaryHistory model
- [ ] Register models in __init__.py
- [ ] Create Contract schemas
- [ ] Create SalaryHistory schemas
- [ ] Update Employee schemas (EmployeeDetailResponse)
- [ ] Create Contract service (with auto salary history on salary change)
- [ ] Create SalaryHistory service
- [ ] Enhance Employee service (get_employee_detail)
- [ ] Create Contract router
- [ ] Create SalaryHistory router
- [ ] Add employee detail endpoint to employees router
- [ ] Register new routers
- [ ] Create migration
- [ ] Create contracts hook
- [ ] Create salary history hook
- [ ] Add useEmployeeDetail to employees hook
- [ ] Create contract form dialog
- [ ] Create employee contracts tab
- [ ] Create employee salary tab
- [ ] Create employee detail page with tabs
- [ ] Add route for employee detail
- [ ] Add row click navigation on employees list

## Success Criteria
- Contract CRUD fully working; status validation enforced
- Salary history auto-created when contract base_salary changes
- Employee detail page shows all tabs with real data
- Navigate from employees list to detail via row click

## Risk Assessment
- Salary history auto-creation must happen in same transaction as contract update
- Contract status transitions should be validated (e.g., can't go from terminated back to active)
