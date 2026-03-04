"""Seed HRM: departments, employees, leave types, leave requests, payroll."""
import json
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def seed_hrm(
    session: AsyncSession,
    ws_id: uuid.UUID,
    demo_id: uuid.UUID,
    alice_id: uuid.UUID,
    bob_id: uuid.UUID,
) -> None:
    print("Creating HRM data...")
    today = datetime.now(timezone.utc)

    # Departments (4)
    dept_ids: list[uuid.UUID] = []
    departments = [
        ("Phong Ky Thuat",   "Bo phan phat trien phan mem va ha tang"),
        ("Phong Marketing",  "Truyen thong, quang cao va thuong hieu"),
        ("Phong Nhan Su",    "Quan ly nhan su, tuyen dung va dao tao"),
        ("Phong Kinh Doanh", "Ban hang va phat trien khach hang"),
    ]
    for name, desc in departments:
        did = uuid.uuid4()
        dept_ids.append(did)
        await session.execute(text("""
            INSERT INTO departments (id, workspace_id, name, description, created_at, updated_at)
            VALUES (:id, :ws, :name, :desc, now(), now())
        """), {"id": did, "ws": ws_id, "name": name, "desc": desc})

    # Employees (8) — 3 linked to app users, 5 standalone
    emp_ids: list[uuid.UUID] = []
    employees = [
        (demo_id,  "Demo User",          "demo@workboard.io",      0, "CTO",                730),
        (alice_id, "Alice Chen",         "alice@workboard.io",     1, "Marketing Manager",   540),
        (bob_id,   "Bob Martinez",       "bob@workboard.io",       0, "Senior Developer",    450),
        (None,     "Nguyen Thi Mai",     "mai.nguyen@acme.vn",     0, "Frontend Developer",  365),
        (None,     "Tran Van Hoang",     "hoang.tran@acme.vn",     3, "Sales Executive",     300),
        (None,     "Le Thi Hong Nhung",  "nhung.le@acme.vn",       2, "HR Specialist",       500),
        (None,     "Pham Duc Minh",      "minh.pham@acme.vn",      0, "Backend Developer",   200),
        (None,     "Vo Thi Thanh Truc",  "truc.vo@acme.vn",        1, "Content Writer",      150),
    ]
    for user_id, name, email, dept_idx, position, hire_days_ago in employees:
        eid = uuid.uuid4()
        emp_ids.append(eid)
        await session.execute(text("""
            INSERT INTO employees (id, workspace_id, user_id, name, email, department_id, position, hire_date, created_at, updated_at)
            VALUES (:id, :ws, :uid, :name, :email, :dept, :pos, :hire, now(), now())
        """), {
            "id": eid, "ws": ws_id, "uid": user_id, "name": name, "email": email,
            "dept": dept_ids[dept_idx], "pos": position,
            "hire": today - timedelta(days=hire_days_ago),
        })

    # Leave Types (4)
    lt_ids: list[uuid.UUID] = []
    leave_types = [
        ("Nghi phep nam",    12),
        ("Nghi om",           5),
        ("Nghi thai san",   180),
        ("Nghi khong luong",  0),
    ]
    for name, days_per_year in leave_types:
        lid = uuid.uuid4()
        lt_ids.append(lid)
        await session.execute(text("""
            INSERT INTO leave_types (id, workspace_id, name, days_per_year, created_at, updated_at)
            VALUES (:id, :ws, :name, :days, now(), now())
        """), {"id": lid, "ws": ws_id, "name": name, "days": days_per_year})

    # Leave Requests (6)
    # (emp_idx, lt_idx, start_offset_days, end_offset_days, num_days, status, reviewer)
    leave_requests = [
        (3, 0, -30, -28, 3, "approved",  demo_id),
        (4, 0, -14, -12, 3, "approved",  demo_id),
        (5, 1,  -7,  -5, 3, "approved",  demo_id),
        (6, 0,  10,  14, 5, "pending",   None),
        (7, 0,  20,  22, 3, "pending",   None),
        (1, 0,  -3,  -1, 3, "rejected",  demo_id),
    ]
    for emp_idx, lt_idx, start_off, end_off, num_days, status, reviewer in leave_requests:
        await session.execute(text("""
            INSERT INTO leave_requests (id, workspace_id, employee_id, leave_type_id, start_date, end_date, days, status, reviewed_by_id, created_at, updated_at)
            VALUES (:id, :ws, :emp, :lt, :start, :end, :days, :status, :reviewer, now(), now())
        """), {
            "id": uuid.uuid4(), "ws": ws_id,
            "emp": emp_ids[emp_idx], "lt": lt_ids[lt_idx],
            "start": (today + timedelta(days=start_off)).date(),
            "end":   (today + timedelta(days=end_off)).date(),
            "days": num_days, "status": status, "reviewer": reviewer,
        })

    # Payroll Records (16) — 2 months x 8 employees
    salaries = {
        0: (45_000_000, {"bhxh": 3_600_000, "bhyt": 675_000, "tncn": 4_500_000}),
        1: (30_000_000, {"bhxh": 2_400_000, "bhyt": 450_000, "tncn": 2_000_000}),
        2: (35_000_000, {"bhxh": 2_800_000, "bhyt": 525_000, "tncn": 3_000_000}),
        3: (22_000_000, {"bhxh": 1_760_000, "bhyt": 330_000, "tncn":   800_000}),
        4: (20_000_000, {"bhxh": 1_600_000, "bhyt": 300_000, "tncn":   600_000}),
        5: (18_000_000, {"bhxh": 1_440_000, "bhyt": 270_000, "tncn":   400_000}),
        6: (25_000_000, {"bhxh": 2_000_000, "bhyt": 375_000, "tncn": 1_200_000}),
        7: (16_000_000, {"bhxh": 1_280_000, "bhyt": 240_000, "tncn":   200_000}),
    }
    for period, pr_status in [("2026-01", "paid"), ("2026-02", "approved")]:
        for emp_idx, (gross, deductions) in salaries.items():
            net = gross - sum(deductions.values())
            await session.execute(text("""
                INSERT INTO payroll_records (id, workspace_id, employee_id, period, gross, net, deductions, status, created_at, updated_at)
                VALUES (:id, :ws, :emp, :period, :gross, :net, :ded, :status, now(), now())
            """), {
                "id": uuid.uuid4(), "ws": ws_id, "emp": emp_ids[emp_idx],
                "period": period, "gross": gross, "net": net,
                "ded": json.dumps(deductions), "status": pr_status,
            })

    print("  HRM: 4 departments, 8 employees, 4 leave types, 6 leave requests, 16 payroll records")
