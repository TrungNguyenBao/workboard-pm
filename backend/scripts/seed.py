"""
Seed script — populates WorkBoard with realistic demo data.
Run from backend/: .venv/Scripts/python.exe scripts/seed.py
"""

import asyncio
import json
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Allow imports from the backend package
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import hash_password

# ---------------------------------------------------------------------------
# Engine (uses same URL as the app default; override via DATABASE_URL env var)
# ---------------------------------------------------------------------------
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://workboard:workboard@localhost:5432/workboard",
)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def days(n: int) -> timedelta:
    return timedelta(days=n)


# ---------------------------------------------------------------------------
# Clear existing data (order matters — FK constraints)
# ---------------------------------------------------------------------------

TRUNCATE_TABLES = (
    "deals, contacts, "
    "goal_task_links, goal_project_links, goals, "
    "task_followers, task_tags, task_dependencies, "
    "comments, attachments, custom_field_definitions, "
    "tasks, sections, project_memberships, projects, "
    "tags, team_memberships, teams, "
    "workspace_memberships, workspaces, "
    "refresh_tokens, activity_logs, notifications, users"
)


async def clear_data(session: AsyncSession) -> None:
    print("  Clearing existing data...")
    await session.execute(text(f"TRUNCATE TABLE {TRUNCATE_TABLES} RESTART IDENTITY CASCADE"))
    await session.commit()
    print("  Done clearing.")


# ---------------------------------------------------------------------------
# Seed
# ---------------------------------------------------------------------------

async def seed(session: AsyncSession) -> None:
    # -----------------------------------------------------------------------
    # USERS
    # -----------------------------------------------------------------------
    print("Creating users...")
    demo_id = uuid.uuid4()
    alice_id = uuid.uuid4()
    bob_id = uuid.uuid4()

    await session.execute(text("""
        INSERT INTO users (id, email, name, hashed_password, is_active, created_at, updated_at)
        VALUES
          (:id1, 'demo@workboard.io', 'Demo User',  :pw1, true, now(), now()),
          (:id2, 'alice@workboard.io', 'Alice Chen', :pw2, true, now(), now()),
          (:id3, 'bob@workboard.io',   'Bob Martinez', :pw3, true, now(), now())
    """), {
        "id1": demo_id, "pw1": hash_password("demo1234"),
        "id2": alice_id, "pw2": hash_password("demo1234"),
        "id3": bob_id,   "pw3": hash_password("demo1234"),
    })

    # -----------------------------------------------------------------------
    # WORKSPACE
    # -----------------------------------------------------------------------
    print("Creating workspace...")
    ws_id = uuid.uuid4()
    await session.execute(text("""
        INSERT INTO workspaces (id, name, slug, owner_id, created_at, updated_at)
        VALUES (:id, 'Acme Corp', 'acme-corp', :owner, now(), now())
    """), {"id": ws_id, "owner": demo_id})

    # Workspace memberships
    for user_id, role in [(demo_id, "admin"), (alice_id, "member"), (bob_id, "member")]:
        await session.execute(text("""
            INSERT INTO workspace_memberships
              (id, workspace_id, user_id, role, created_at, updated_at)
            VALUES (:id, :ws, :user, :role, now(), now())
        """), {"id": uuid.uuid4(), "ws": ws_id, "user": user_id, "role": role})

    # -----------------------------------------------------------------------
    # TAGS
    # -----------------------------------------------------------------------
    print("Creating tags...")
    tag_data = [
        ("bug",     "#EF4444"),
        ("feature", "#3B82F6"),
        ("urgent",  "#F59E0B"),
        ("design",  "#8B5CF6"),
        ("backend", "#10B981"),
    ]
    tag_ids: dict[str, uuid.UUID] = {}
    for name, color in tag_data:
        tid = uuid.uuid4()
        tag_ids[name] = tid
        await session.execute(text("""
            INSERT INTO tags (id, workspace_id, name, color, created_at, updated_at)
            VALUES (:id, :ws, :name, :color, now(), now())
        """), {"id": tid, "ws": ws_id, "name": name, "color": color})

    # -----------------------------------------------------------------------
    # PROJECTS
    # -----------------------------------------------------------------------
    print("Creating projects...")
    projects: dict[str, uuid.UUID] = {}
    project_defs = [
        ("Website Redesign", "#5E6AD2", "Complete overhaul of company website"),
        ("Mobile App",        "#F59E0B", "iOS and Android app development"),
        ("Q1 Marketing",      "#10B981", "Q1 marketing campaigns and content"),
    ]
    for name, color, desc in project_defs:
        pid = uuid.uuid4()
        projects[name] = pid
        await session.execute(text("""
            INSERT INTO projects
              (id, workspace_id, owner_id, name, description, color,
               visibility, is_archived, created_at, updated_at)
            VALUES (:id, :ws, :owner, :name, :desc, :color,
                    'public', false, now(), now())
        """), {
            "id": pid, "ws": ws_id, "owner": demo_id,
            "name": name, "desc": desc, "color": color,
        })
        # Project memberships (owner + alice + bob)
        for uid, role in [(demo_id, "owner"), (alice_id, "editor"), (bob_id, "editor")]:
            await session.execute(text("""
                INSERT INTO project_memberships
                  (id, project_id, user_id, role, created_at, updated_at)
                VALUES (:id, :proj, :user, :role, now(), now())
            """), {"id": uuid.uuid4(), "proj": pid, "user": uid, "role": role})

    # -----------------------------------------------------------------------
    # SECTIONS (3 per project)
    # -----------------------------------------------------------------------
    print("Creating sections...")
    section_names = ["To Do", "In Progress", "Done"]
    sections: dict[tuple[str, str], uuid.UUID] = {}  # (project_name, section_name) -> id

    for proj_name, proj_id in projects.items():
        for idx, sec_name in enumerate(section_names):
            sid = uuid.uuid4()
            sections[(proj_name, sec_name)] = sid
            await session.execute(text("""
                INSERT INTO sections
                  (id, project_id, name, position, created_at, updated_at)
                VALUES (:id, :proj, :name, :pos, now(), now())
            """), {"id": sid, "proj": proj_id, "name": sec_name, "pos": float((idx + 1) * 65536)})

    # -----------------------------------------------------------------------
    # CUSTOM FIELD DEFINITIONS  (Website Redesign project only)
    # -----------------------------------------------------------------------
    print("Creating custom field definitions...")
    wr_proj_id = projects["Website Redesign"]

    cf_story_id = uuid.uuid4()
    cf_sprint_id = uuid.uuid4()
    cf_reviewed_id = uuid.uuid4()

    await session.execute(text("""
        INSERT INTO custom_field_definitions
          (id, project_id, created_by_id, name, field_type, required,
           options, position, created_at, updated_at)
        VALUES
          (:id1, :proj, :user, 'Story Points', 'number', false, NULL, 65536, now(), now()),
          (:id2, :proj, :user, 'Sprint', 'single_select', false,
           '{"choices": ["Sprint 1", "Sprint 2", "Sprint 3"]}'::jsonb, 131072, now(), now()),
          (:id3, :proj, :user, 'Reviewed', 'checkbox', false, NULL, 196608, now(), now())
    """), {
        "id1": cf_story_id, "id2": cf_sprint_id, "id3": cf_reviewed_id,
        "proj": wr_proj_id, "user": demo_id,
    })

    # -----------------------------------------------------------------------
    # TASKS
    # -----------------------------------------------------------------------
    print("Creating tasks...")

    # Helper: insert one task, return its id
    async def insert_task(
        *,
        project: str,
        section: str,
        title: str,
        description: str | None = None,
        status: str = "incomplete",
        priority: str = "none",
        assignee_id: uuid.UUID | None = None,
        start_date: datetime | None = None,
        due_date: datetime | None = None,
        recurrence_rule: str | None = None,
        recurrence_cron_expr: str | None = None,
        parent_id: uuid.UUID | None = None,
        custom_fields: dict | None = None,
        position: float = 65536.0,
    ) -> uuid.UUID:
        tid = uuid.uuid4()
        completed_at = now_utc() if status == "completed" else None
        await session.execute(text("""
            INSERT INTO tasks
              (id, project_id, section_id, assignee_id, created_by_id, parent_id,
               title, description, status, priority, position,
               start_date, due_date, completed_at,
               recurrence_rule, recurrence_cron_expr,
               custom_fields, created_at, updated_at)
            VALUES
              (:id, :proj, :sec, :assignee, :creator, :parent,
               :title, :desc, :status, :priority, :pos,
               :start_date, :due_date, :completed_at,
               :recurrence_rule, :recurrence_cron_expr,
               :custom_fields, now(), now())
        """), {
            "id": tid,
            "proj": projects[project],
            "sec": sections[(project, section)],
            "assignee": assignee_id,
            "creator": demo_id,
            "parent": parent_id,
            "title": title,
            "desc": description,
            "status": status,
            "priority": priority,
            "pos": position,
            "start_date": start_date,
            "due_date": due_date,
            "completed_at": completed_at,
            "recurrence_rule": recurrence_rule,
            "recurrence_cron_expr": recurrence_cron_expr,
            "custom_fields": json.dumps(custom_fields) if custom_fields is not None else None,
        })
        return tid

    now = now_utc()

    # --- Website Redesign tasks ---
    t_wr1 = await insert_task(
        project="Website Redesign", section="To Do",
        title="Define new information architecture",
        description="Map all existing pages and propose new site structure.",
        priority="high",
        assignee_id=alice_id,
        start_date=now + days(1),
        due_date=now + days(10),
        custom_fields={str(cf_story_id): 8, str(cf_sprint_id): "Sprint 1", str(cf_reviewed_id): False},
        position=65536.0,
    )

    t_wr2 = await insert_task(
        project="Website Redesign", section="To Do",
        title="Create wireframes for homepage",
        description="Design low-fidelity wireframes for desktop and mobile breakpoints.",
        priority="high",
        assignee_id=alice_id,
        due_date=now + days(14),
        custom_fields={str(cf_story_id): 5, str(cf_sprint_id): "Sprint 1", str(cf_reviewed_id): False},
        position=131072.0,
    )

    t_wr3 = await insert_task(
        project="Website Redesign", section="In Progress",
        title="Audit current website performance",
        description="Run Lighthouse and identify Core Web Vitals issues.",
        status="incomplete",
        priority="medium",
        assignee_id=demo_id,
        start_date=now - days(3),
        due_date=now + days(2),
        custom_fields={str(cf_story_id): 3, str(cf_sprint_id): "Sprint 1", str(cf_reviewed_id): False},
        position=65536.0,
    )

    t_wr4 = await insert_task(
        project="Website Redesign", section="In Progress",
        title="Set up design system in Figma",
        description="Establish tokens: colors, spacing, typography, and component library.",
        status="incomplete",
        priority="urgent",
        assignee_id=alice_id,
        start_date=now - days(5),
        due_date=now - days(1),  # overdue
        custom_fields={str(cf_story_id): 13, str(cf_sprint_id): "Sprint 2", str(cf_reviewed_id): False},
        position=131072.0,
    )

    t_wr5 = await insert_task(
        project="Website Redesign", section="Done",
        title="Kick-off meeting with stakeholders",
        status="completed",
        priority="none",
        assignee_id=demo_id,
        due_date=now - days(14),
        custom_fields={str(cf_story_id): 1, str(cf_sprint_id): "Sprint 1", str(cf_reviewed_id): True},
        position=65536.0,
    )

    t_wr6 = await insert_task(
        project="Website Redesign", section="Done",
        title="Collect brand assets from marketing",
        status="completed",
        priority="low",
        assignee_id=bob_id,
        due_date=now - days(7),
        custom_fields={str(cf_story_id): 2, str(cf_sprint_id): "Sprint 1", str(cf_reviewed_id): True},
        position=131072.0,
    )

    # Subtask for t_wr2
    t_wr2_sub1 = await insert_task(
        project="Website Redesign", section="To Do",
        title="Research competitor homepage layouts",
        priority="medium",
        parent_id=t_wr2,
        position=65536.0,
    )
    t_wr2_sub2 = await insert_task(
        project="Website Redesign", section="To Do",
        title="Sketch initial mobile navigation concepts",
        priority="medium",
        parent_id=t_wr2,
        position=131072.0,
    )

    # --- Mobile App tasks ---
    t_mob1 = await insert_task(
        project="Mobile App", section="To Do",
        title="Set up React Native project",
        description="Initialise monorepo with Expo, configure ESLint and TypeScript.",
        priority="high",
        assignee_id=bob_id,
        start_date=now + days(2),
        due_date=now + days(7),
        position=65536.0,
    )

    t_mob2 = await insert_task(
        project="Mobile App", section="To Do",
        title="Design authentication screens",
        description="Login, Sign-up, Forgot password and OTP screens.",
        priority="high",
        assignee_id=alice_id,
        due_date=now + days(12),
        position=131072.0,
    )

    t_mob3 = await insert_task(
        project="Mobile App", section="In Progress",
        title="Implement push notification service",
        description="Integrate Firebase Cloud Messaging for iOS and Android.",
        status="incomplete",
        priority="medium",
        assignee_id=bob_id,
        start_date=now - days(4),
        due_date=now + days(5),
        recurrence_rule="weekly",
        recurrence_cron_expr="0 9 * * 1",
        position=65536.0,
    )

    t_mob4 = await insert_task(
        project="Mobile App", section="In Progress",
        title="Build task list screen",
        description="Port web task list to native with swipe actions.",
        status="incomplete",
        priority="high",
        assignee_id=bob_id,
        start_date=now - days(2),
        due_date=now + days(8),
        position=131072.0,
    )

    t_mob5 = await insert_task(
        project="Mobile App", section="Done",
        title="Write technical specification doc",
        status="completed",
        priority="none",
        assignee_id=demo_id,
        due_date=now - days(20),
        position=65536.0,
    )

    # Subtask for t_mob3
    t_mob3_sub = await insert_task(
        project="Mobile App", section="In Progress",
        title="Configure APNs certificates for iOS",
        priority="high",
        parent_id=t_mob3,
        position=65536.0,
    )

    # --- Q1 Marketing tasks ---
    t_mkt1 = await insert_task(
        project="Q1 Marketing", section="To Do",
        title="Plan social media content calendar",
        description="Schedule 3 posts/week across LinkedIn, Twitter, and Instagram.",
        priority="medium",
        assignee_id=alice_id,
        start_date=now + days(1),
        due_date=now + days(5),
        recurrence_rule="daily",
        recurrence_cron_expr="0 8 * * *",
        position=65536.0,
    )

    t_mkt2 = await insert_task(
        project="Q1 Marketing", section="To Do",
        title="Write Q1 product launch blog post",
        priority="high",
        assignee_id=alice_id,
        due_date=now + days(20),
        position=131072.0,
    )

    t_mkt3 = await insert_task(
        project="Q1 Marketing", section="In Progress",
        title="Set up email drip campaign",
        description="Configure Mailchimp sequences for new trial sign-ups.",
        status="incomplete",
        priority="high",
        assignee_id=bob_id,
        start_date=now - days(6),
        due_date=now + days(3),
        position=65536.0,
    )

    t_mkt4 = await insert_task(
        project="Q1 Marketing", section="Done",
        title="Competitor analysis report",
        status="completed",
        priority="low",
        assignee_id=demo_id,
        due_date=now - days(10),
        position=65536.0,
    )

    t_mkt5 = await insert_task(
        project="Q1 Marketing", section="Done",
        title="Define Q1 OKRs",
        status="completed",
        priority="urgent",
        assignee_id=demo_id,
        due_date=now - days(30),
        position=131072.0,
    )

    # -----------------------------------------------------------------------
    # TAGS on tasks
    # -----------------------------------------------------------------------
    print("Assigning tags to tasks...")

    tag_assignments = [
        (t_wr3, "backend"),
        (t_wr4, "design"),
        (t_wr4, "urgent"),
        (t_mob3, "backend"),
        (t_mob3, "urgent"),
        (t_mob4, "feature"),
        (t_mkt1, "feature"),
        (t_mkt3, "urgent"),
    ]
    for task_id, tag_name in tag_assignments:
        await session.execute(text("""
            INSERT INTO task_tags (task_id, tag_id)
            VALUES (:task, :tag)
            ON CONFLICT DO NOTHING
        """), {"task": task_id, "tag": tag_ids[tag_name]})

    # -----------------------------------------------------------------------
    # COMMENTS
    # -----------------------------------------------------------------------
    print("Creating comments...")

    comments_data = [
        (t_wr4, alice_id,
         "<p>I've started the token setup but the typography scale still needs sign-off from the brand team.</p>",
         "I've started the token setup but the typography scale still needs sign-off from the brand team."),
        (t_wr4, demo_id,
         "<p>Let's schedule a quick review call tomorrow at 10 AM to unblock you.</p>",
         "Let's schedule a quick review call tomorrow at 10 AM to unblock you."),
        (t_mob3, bob_id,
         "<p>FCM is integrated for Android. APNs needs the renewed certificate from the Apple Developer portal.</p>",
         "FCM is integrated for Android. APNs needs the renewed certificate from the Apple Developer portal."),
        (t_mkt1, alice_id,
         "<p>Draft calendar is in Google Sheets — sharing link with everyone now.</p>",
         "Draft calendar is in Google Sheets — sharing link with everyone now."),
        (t_wr1, demo_id,
         "<p>Reference architecture from Nielsen Norman Group attached as inspiration.</p>",
         "Reference architecture from Nielsen Norman Group attached as inspiration."),
    ]

    for task_id, author_id, body, body_text in comments_data:
        await session.execute(text("""
            INSERT INTO comments
              (id, task_id, author_id, body, body_text, created_at, updated_at)
            VALUES (:id, :task, :author, :body, :body_text, now(), now())
        """), {
            "id": uuid.uuid4(),
            "task": task_id, "author": author_id,
            "body": body, "body_text": body_text,
        })

    # -----------------------------------------------------------------------
    # GOALS
    # -----------------------------------------------------------------------
    print("Creating goals...")
    goal1_id = uuid.uuid4()
    goal2_id = uuid.uuid4()

    await session.execute(text("""
        INSERT INTO goals
          (id, workspace_id, owner_id, title, description, status,
           progress_value, calculation_method, color, due_date,
           created_at, updated_at)
        VALUES
          (:id1, :ws, :owner, 'Launch Website v2',
           'Ship the redesigned public website to production by end of Q1.',
           'on_track', 40.0, 'auto', '#5E6AD2',
           :due1, now(), now()),
          (:id2, :ws, :owner, 'Ship Mobile MVP',
           'Release the iOS and Android app to the stores with core feature set.',
           'at_risk', 35.0, 'manual', '#F59E0B',
           :due2, now(), now())
    """), {
        "id1": goal1_id, "id2": goal2_id,
        "ws": ws_id, "owner": demo_id,
        "due1": now + days(60),
        "due2": now + days(90),
    })

    # Goal <-> Project links
    await session.execute(text("""
        INSERT INTO goal_project_links (goal_id, project_id, created_at)
        VALUES
          (:g1, :p1, now()),
          (:g2, :p2, now())
    """), {
        "g1": goal1_id, "p1": projects["Website Redesign"],
        "g2": goal2_id, "p2": projects["Mobile App"],
    })

    # -----------------------------------------------------------------------
    # TASK FOLLOWERS  (demo user follows a couple of tasks)
    # -----------------------------------------------------------------------
    print("Adding task followers...")
    for task_id in [t_wr4, t_mob3, t_mkt3]:
        await session.execute(text("""
            INSERT INTO task_followers (task_id, user_id)
            VALUES (:task, :user)
            ON CONFLICT DO NOTHING
        """), {"task": task_id, "user": demo_id})

    # -----------------------------------------------------------------------
    # CRM — CONTACTS
    # -----------------------------------------------------------------------
    print("Creating CRM contacts...")

    crm_contact_data = [
        ("Sophia Turner",    "sophia.turner@acmecorp.com",  "+1-415-555-0101", "Acme Corp"),
        ("James Whitfield",  "j.whitfield@nexatech.io",     "+1-212-555-0202", "NexaTech"),
        ("Priya Nair",       "priya@brightwave.co",         "+44-20-5555-0303", "BrightWave"),
        ("Carlos Mendez",    "carlos.mendez@velocloud.net", "+34-91-555-0404", "VeloCloud"),
        ("Aiko Yamamoto",    "aiko@tokyoventures.jp",       "+81-3-5555-0505", "Tokyo Ventures"),
        ("Elena Vasquez",    "elena.v@quantumleap.io",      "+1-650-555-0606", "QuantumLeap"),
        ("Marcus Klein",     "m.klein@alphasoft.de",        "+49-30-5555-0707", "AlphaSoft"),
        ("Isabelle Moreau",  "i.moreau@labelletech.fr",     "+33-1-5555-0808", "LaBelleTech"),
        ("Raj Patel",        "raj.patel@inditech.in",       "+91-22-5555-0909", "IndiTech"),
        ("Omar Hassan",      "omar@sandstormio.ae",         "+971-4-555-1010", "Sandstorm IO"),
    ]

    contact_ids: list[uuid.UUID] = []
    for name, email, phone, company in crm_contact_data:
        cid = uuid.uuid4()
        contact_ids.append(cid)
        await session.execute(text("""
            INSERT INTO contacts (id, workspace_id, name, email, phone, company, created_at, updated_at)
            VALUES (:id, :ws, :name, :email, :phone, :company, now(), now())
        """), {"id": cid, "ws": ws_id, "name": name, "email": email, "phone": phone, "company": company})

    # -----------------------------------------------------------------------
    # CRM — DEALS
    # -----------------------------------------------------------------------
    print("Creating CRM deals...")

    crm_deal_data = [
        # (title, value, stage, contact_index)
        ("Enterprise License — NexaTech",        48000.0,  "negotiation",  1),
        ("Cloud Migration Package — VeloCloud",  125000.0, "proposal",     3),
        ("Starter Plan — BrightWave",            3200.0,   "closed_won",   2),
        ("Annual SaaS Contract — QuantumLeap",   72000.0,  "qualified",    5),
        ("Pilot Program — Tokyo Ventures",       9500.0,   "lead",         4),
        ("Premium Support — AlphaSoft",          18000.0,  "closed_won",   6),
        ("Integration Services — IndiTech",      34000.0,  "proposal",     8),
        ("Consulting Retainer — Sandstorm IO",   60000.0,  "negotiation",  9),
        ("Basic Tier — LaBelleTech",             2400.0,   "lead",         7),
        ("Renewal — Acme Corp",                  95000.0,  "closed_won",   0),
        ("Upsell — NexaTech Pro",                22000.0,  "qualified",    1),
        ("Trial Conversion — BrightWave",        5800.0,   "closed_lost",  2),
    ]

    for title, value, stage, contact_idx in crm_deal_data:
        await session.execute(text("""
            INSERT INTO deals (id, workspace_id, contact_id, title, value, stage, created_at, updated_at)
            VALUES (:id, :ws, :contact, :title, :value, :stage, now(), now())
        """), {
            "id": uuid.uuid4(),
            "ws": ws_id,
            "contact": contact_ids[contact_idx],
            "title": title,
            "value": value,
            "stage": stage,
        })

    # -----------------------------------------------------------------------
    # Commit everything
    # -----------------------------------------------------------------------
    await session.commit()
    print()
    print("Seed complete.")
    print(f"  Users         : demo@workboard.io, alice@workboard.io, bob@workboard.io  (pw: demo1234)")
    print(f"  Workspace     : Acme Corp")
    print(f"  Projects      : {', '.join(projects.keys())}")
    print(f"  Tags          : {', '.join(tag_ids.keys())}")
    print(f"  Tasks         : 18 tasks (3 subtasks included)")
    print(f"  Goals         : Launch Website v2, Ship Mobile MVP")
    print(f"  Comments      : 5")
    print(f"  Custom fields : Story Points, Sprint, Reviewed (Website Redesign)")
    print(f"  CRM Contacts  : {len(crm_contact_data)}")
    print(f"  CRM Deals     : {len(crm_deal_data)}")


# ---------------------------------------------------------------------------
# Entry-point
# ---------------------------------------------------------------------------

async def main() -> None:
    print("WorkBoard seed script")
    print("=" * 40)
    async with AsyncSessionLocal() as session:
        await clear_data(session)
        await seed(session)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
