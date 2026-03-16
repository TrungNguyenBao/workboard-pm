import re
import uuid
import json
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.scripts.seed_shared import AsyncSessionLocal, seed_users_and_workspace, now_utc, days

async def parse_crm_stories():
    # Adjust path to look one level up from backend
    with open("../docs/userstorie/user-storie-crm.md", "r", encoding="utf-8") as f:
        content = f.read()
    
    epics = []
    # Epic pattern: # Epic N: Name
    epic_matches = re.finditer(r"# Epic (\d+): (.*?)\n(.*?)(?=# Epic|\Z)", content, re.DOTALL)
    for match in epic_matches:
        epic_name = match.group(2).strip()
        epic_desc = match.group(3).split("##")[0].strip()
        
        stories = []
        # US pattern: ## US-XXX: Name
        us_matches = re.finditer(r"## (US-\d+): (.*?)\n(.*?)(?=## US-|\Z)", match.group(3), re.DOTALL)
        for us_match in us_matches:
            title = us_match.group(2).strip()
            # Extract priority and status if possible
            priority_match = re.search(r"Priority \| (P\d+)", us_match.group(3))
            priority = priority_match.group(1) if priority_match else "P1"
            
            stories.append({
                "id": us_match.group(1),
                "title": title,
                "priority": priority
            })
        
        epics.append({
            "name": epic_name,
            "description": epic_desc,
            "stories": stories
        })
    return epics

async def get_hrm_tasks():
    # Since HRM story file is empty, extract from HRM_PRD.md features section
    return [
        {"name": "Recruitment Lifecycle", "tasks": ["Job requests", "Candidates Management", "Interview Scheduling", "Offers Management"]},
        {"name": "Employee Onboarding", "tasks": ["Checklist tasks", "Asset assignment", "Orientation planning"]},
        {"name": "Leave & Attendance", "tasks": ["Leave request workflow", "Attendance tracking", "Overtime request tracking"]},
        {"name": "Performance Management", "tasks": ["Periodic reviews", "KPI templates", "KPI actual value tracking"]},
        {"name": "Payroll & Benefits", "tasks": ["Salary history tracking", "Payroll record generation", "Insurance record management"]}
    ]

async def seed_erp_agentic(session: AsyncSession = None):
    if session is None:
        async with AsyncSessionLocal() as session:
            await _run_seed(session)
    else:
        await _run_seed(session)

async def _run_seed(session: AsyncSession):
    # 0. Clear Existing Data
    from app.scripts.seed_shared import clear_data
    print("Clearing existing data...")
    # NOTE: In production (VPS), you might want to skip clear_data 
    # if you only want to ADD the user. But per request, we recreate.
    await clear_data(session)

    # 1. Setup Base Data
    print("Initializing base data...")
    shared = await seed_users_and_workspace(session)
    ws_id = shared["ws_id"]
    
    # Add the specific user requested
    vynt_id = uuid.uuid4()
    from app.core.security import hash_password
    await session.execute(text("""
        INSERT INTO users (id, email, name, hashed_password, is_active, created_at, updated_at)
        VALUES (:id, 'vynt@gmail.com', 'VYNT User', :pw, true, now(), now())
    """), {"id": vynt_id, "pw": hash_password("demo1234")})
    
    await session.execute(text("""
        INSERT INTO workspace_memberships (id, workspace_id, user_id, role, created_at, updated_at)
        VALUES (:id, :ws, :user, 'admin', now(), now())
    """), {"id": uuid.uuid4(), "ws": ws_id, "user": vynt_id, "role": "admin"})

    demo_id = vynt_id # Set vynt as the owner/primary user for the project
    
    # 2. Create ERP Agentic Project
    print("Creating 'ERP Agentic' project...")
    proj_id = uuid.uuid4()
    await session.execute(text("""
        INSERT INTO projects (id, workspace_id, owner_id, name, description, color, visibility, project_type, created_at, updated_at)
        VALUES (:id, :ws, :owner, 'ERP Agentic', 'Hệ thống quản trị nguồn lực doanh nghiệp tích hợp Agent AI', '#4F46E5', 'public', 'agile', now(), now())
    """), {"id": proj_id, "ws": ws_id, "owner": demo_id})
    
    # Add primary members
    for uid in [shared["alice_id"], shared["bob_id"]]:
        await session.execute(text("""
            INSERT INTO project_memberships (id, project_id, user_id, role, created_at, updated_at)
            VALUES (:id, :proj, :user, 'editor', now(), now())
        """), {"id": uuid.uuid4(), "proj": proj_id, "user": uid})

    # 3. Create Sections
    print("Creating sections...")
    sections = ["Backlog", "To Do", "In Progress", "Review", "Done"]
    section_ids = {}
    for idx, name in enumerate(sections):
        sid = uuid.uuid4()
        section_ids[name] = sid
        await session.execute(text("""
            INSERT INTO sections (id, project_id, name, position, created_at, updated_at)
            VALUES (:id, :proj, :name, :pos, now(), now())
        """), {"id": sid, "proj": proj_id, "name": name, "pos": float((idx + 1) * 65536)})

    # 4. Create Tags
    print("Creating tags...")
    tags = {"CRM": "#3B82F6", "HRM": "#10B981"}
    tag_ids = {}
    for name, color in tags.items():
        tid = uuid.uuid4()
        tag_ids[name] = tid
        await session.execute(text("""
            INSERT INTO tags (id, workspace_id, name, color, created_at, updated_at)
            VALUES (:id, :ws, :name, :color, now(), now())
        """), {"id": tid, "ws": ws_id, "name": name, "color": color})

    # 5. Parse and Seed CRM Data
    print("Seeding CRM tasks...")
    crm_epics = await parse_crm_stories()
    for epic in crm_epics:
        # Create Epic as specific task type
        epic_id = uuid.uuid4()
        await session.execute(text("""
            INSERT INTO tasks (id, project_id, section_id, created_by_id, title, description, task_type, created_at, updated_at)
            VALUES (:id, :proj, :sec, :user, :title, :desc, 'epic', now(), now())
        """), {
            "id": epic_id, "proj": proj_id, "sec": section_ids["Backlog"], "user": demo_id,
            "title": f"Epic: {epic['name']}", "desc": epic['description']
        })
        
        for us in epic["stories"]:
            us_id = uuid.uuid4()
            # Priority Mapping
            p_map = {"P0": "urgent", "P1": "high", "P2": "medium"}
            priority = p_map.get(us["priority"], "none")
            
            await session.execute(text("""
                INSERT INTO tasks (id, project_id, section_id, created_by_id, parent_id, title, priority, task_type, created_at, updated_at)
                VALUES (:id, :proj, :sec, :user, :parent, :title, :pri, 'story', now(), now())
            """), {
                "id": us_id, "proj": proj_id, "sec": section_ids["To Do"], "user": demo_id,
                "parent": epic_id, "title": f"[{us['id']}] {us['title']}", "pri": priority
            })
            # Add CRM tag
            await session.execute(text("INSERT INTO task_tags (task_id, tag_id) VALUES (:ts, :tg)"), {"ts": us_id, "tg": tag_ids["CRM"]})

    # 6. Seed HRM Data
    print("Seeding HRM tasks...")
    hrm_data = await get_hrm_tasks()
    for epic_data in hrm_data:
        epic_id = uuid.uuid4()
        await session.execute(text("""
            INSERT INTO tasks (id, project_id, section_id, created_by_id, title, task_type, created_at, updated_at)
            VALUES (:id, :proj, :sec, :user, :title, 'epic', now(), now())
        """), {
            "id": epic_id, "proj": proj_id, "sec": section_ids["Backlog"], "user": demo_id,
            "title": f"Epic: HRM - {epic_data['name']}"
        })
        
        for task_name in epic_data["tasks"]:
            tid = uuid.uuid4()
            await session.execute(text("""
                INSERT INTO tasks (id, project_id, section_id, created_by_id, parent_id, title, task_type, created_at, updated_at)
                VALUES (:id, :proj, :sec, :user, :parent, :title, 'task', now(), now())
            """), {
                "id": tid, "proj": proj_id, "sec": section_ids["To Do"], "user": demo_id,
                "parent": epic_id, "title": task_name
            })
            # Add HRM tag
            await session.execute(text("INSERT INTO task_tags (task_id, tag_id) VALUES (:ts, :tg)"), {"ts": tid, "tg": tag_ids["HRM"]})

    print("Seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_erp_agentic())
