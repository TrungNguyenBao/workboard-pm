# Phase 3: Add HRM Seed Data

## Context
- HRM models exist: Department, Employee, LeaveType, LeaveRequest, PayrollRecord
- All have `workspace_id` FK
- Employee has optional `user_id` FK (can link to app users)
- No HRM data in current seed script

## Overview
- **Priority**: P1
- **Status**: completed
- **Effort**: 30min

## Key Insights from Model Analysis

| Model | Table | Key Columns | Notes |
|-------|-------|-------------|-------|
| Department | `departments` | name, description, workspace_id | Simple |
| Employee | `employees` | user_id (nullable FK->users), name, email, department_id (nullable FK), position, hire_date, workspace_id | Can link to app user |
| LeaveType | `leave_types` | name, days_per_year (int), workspace_id | |
| LeaveRequest | `leave_requests` | employee_id (FK CASCADE), leave_type_id (FK RESTRICT), start_date (Date), end_date (Date), days (int), status (pending/approved/rejected), reviewed_by_id (nullable FK->users), workspace_id | |
| PayrollRecord | `payroll_records` | employee_id (FK CASCADE), period (String "YYYY-MM"), gross (Numeric 12,2), net (Numeric 12,2), deductions (JSONB), status (draft/approved/paid), workspace_id | |

FK chain: LeaveRequest -> Employee, LeaveType. PayrollRecord -> Employee.

## Related Code Files

### Files to Create
- `backend/app/scripts/seed_hrm.py`

## Seed Data Specification

### Departments (4)
```python
departments = [
    ("Phong Ky Thuat",    "Bo phan phat trien phan mem va ha tang"),      # Engineering
    ("Phong Marketing",   "Truyen thong, quang cao va thuong hieu"),       # Marketing
    ("Phong Nhan Su",     "Quan ly nhan su, tuyen dung va dao tao"),       # HR
    ("Phong Kinh Doanh",  "Ban hang va phat trien khach hang"),            # Sales
]
```

### Employees (8)
3 linked to app users (demo, alice, bob), 5 standalone Vietnamese employees.
```python
employees = [
    # (user_id_or_None, name, email, dept_index, position, hire_date_offset_days_ago)
    (demo_id,  "Demo User",          "demo@workboard.io",      0, "CTO",                   730),
    (alice_id, "Alice Chen",          "alice@workboard.io",     1, "Marketing Manager",     540),
    (bob_id,   "Bob Martinez",        "bob@workboard.io",       0, "Senior Developer",      450),
    (None,     "Nguyen Thi Mai",      "mai.nguyen@acme.vn",     0, "Frontend Developer",    365),
    (None,     "Tran Van Hoang",      "hoang.tran@acme.vn",     3, "Sales Executive",       300),
    (None,     "Le Thi Hong Nhung",   "nhung.le@acme.vn",       2, "HR Specialist",         500),
    (None,     "Pham Duc Minh",       "minh.pham@acme.vn",      0, "Backend Developer",     200),
    (None,     "Vo Thi Thanh Truc",   "truc.vo@acme.vn",        1, "Content Writer",        150),
]
```

### Leave Types (4)
```python
leave_types = [
    ("Nghi phep nam",     12),    # Annual leave
    ("Nghi om",            5),    # Sick leave
    ("Nghi thai san",    180),    # Maternity leave
    ("Nghi khong luong",   0),    # Unpaid leave
]
```

### Leave Requests (6)
Mix of statuses. Use `datetime.date` for start_date/end_date.
```python
leave_requests = [
    # (employee_index, leave_type_index, start_offset_days, end_offset_days, days, status, reviewed_by)
    (3, 0,  -30, -28, 3, "approved", demo_id),   # Mai - annual, past, approved
    (4, 0,  -14, -12, 3, "approved", demo_id),   # Hoang - annual, past, approved
    (5, 1,   -7,  -5, 3, "approved", demo_id),   # Nhung - sick, past, approved
    (6, 0,   10,  14, 5, "pending",  None),       # Minh - annual, future, pending
    (7, 0,   20,  22, 3, "pending",  None),       # Truc - annual, future, pending
    (1, 0,   -3,  -1, 3, "rejected", demo_id),   # Alice - annual, past, rejected
]
```

### Payroll Records (16) -- 2 months x 8 employees
Period: "2026-01" and "2026-02"
```python
# Base salaries by position (VND monthly, stored as gross)
salaries = {
    0: (45_000_000, {"bhxh": 3_600_000, "bhyt": 675_000, "tncn": 4_500_000}),  # CTO
    1: (30_000_000, {"bhxh": 2_400_000, "bhyt": 450_000, "tncn": 2_000_000}),  # Marketing Mgr
    2: (35_000_000, {"bhxh": 2_800_000, "bhyt": 525_000, "tncn": 3_000_000}),  # Sr Dev
    3: (22_000_000, {"bhxh": 1_760_000, "bhyt": 330_000, "tncn": 800_000}),    # FE Dev
    4: (20_000_000, {"bhxh": 1_600_000, "bhyt": 300_000, "tncn": 600_000}),    # Sales Exec
    5: (18_000_000, {"bhxh": 1_440_000, "bhyt": 270_000, "tncn": 400_000}),    # HR Specialist
    6: (25_000_000, {"bhxh": 2_000_000, "bhyt": 375_000, "tncn": 1_200_000}),  # BE Dev
    7: (16_000_000, {"bhxh": 1_280_000, "bhyt": 240_000, "tncn": 200_000}),    # Content Writer
}
# net = gross - sum(deductions)
# Jan payroll: all "paid"
# Feb payroll: all "approved"
```

Deduction keys: `bhxh` (social insurance), `bhyt` (health insurance), `tncn` (personal income tax) -- standard Vietnamese payroll deductions.

## Implementation Steps

### Step 1: Create `backend/app/scripts/seed_hrm.py`

Function signature:
```python
async def seed_hrm(
    session: AsyncSession,
    ws_id: uuid.UUID,
    demo_id: uuid.UUID,
) -> dict:
    """Seed HRM: departments, employees, leave types, leave requests, payroll."""
```

The function receives `demo_id` to:
- Link employees to users (demo, alice, bob via existing user IDs passed through)
- Set `reviewed_by_id` on approved/rejected leave requests

**Update**: Actually needs `alice_id` and `bob_id` too for user_id linking. Update signature:
```python
async def seed_hrm(session, ws_id, demo_id, alice_id, bob_id) -> dict:
```

Insert order (respects FK):
1. Departments
2. Employees (FK -> departments, users)
3. Leave Types
4. Leave Requests (FK -> employees, leave_types)
5. Payroll Records (FK -> employees)

### Step 2: Wire into `__main__.py`
Already planned: `await seed_hrm(session, ws_id, demo_id, alice_id, bob_id)`

## Todo List
- [x] Create `backend/app/scripts/seed_hrm.py`
- [x] Ensure file stays under 200 lines
- [x] Test by running `make seed`
- [x] Verified: 4 departments, 8 employees (3 linked to app users), 4 leave types, 6 leave requests, 16 payroll records created

## Success Criteria
- 4 departments, 8 employees, 4 leave types, 6 leave requests, 16 payroll records
- 3 employees linked to app users
- Vietnamese names, positions, deduction labels
- Payroll with realistic VND amounts
- File under 200 lines

## Risk Assessment
- **Date types**: LeaveRequest uses `date` (not `datetime`). Must use `datetime.date` objects, not `datetime.datetime`.
- **Numeric precision**: PayrollRecord.gross/net are `Numeric(12,2)`. Python floats are fine for the insert; DB handles precision.
- **JSONB deductions**: Must pass as `json.dumps(dict)` in raw SQL, just like custom_fields in PMS.
