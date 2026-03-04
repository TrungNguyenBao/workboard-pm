"""Shared seed utilities: engine, helpers, users, workspace."""
import os
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import hash_password

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://workboard:workboard@localhost:5432/workboard",
)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def days(n: int) -> timedelta:
    return timedelta(days=n)


# All tables from all modules — order matters for FK constraints
TRUNCATE_TABLES = (
    "payroll_records, leave_requests, leave_types, employees, departments, "
    "inventory_items, wms_devices, wms_products, wms_suppliers, warehouses, "
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
    await session.execute(
        text(f"TRUNCATE TABLE {TRUNCATE_TABLES} RESTART IDENTITY CASCADE")
    )
    await session.commit()
    print("  Done clearing.")


async def seed_users_and_workspace(session: AsyncSession) -> dict:
    """Create 3 users + 1 workspace + memberships. Returns dict with IDs."""
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

    print("Creating workspace...")
    ws_id = uuid.uuid4()
    await session.execute(text("""
        INSERT INTO workspaces (id, name, slug, owner_id, created_at, updated_at)
        VALUES (:id, 'Acme Corp', 'acme-corp', :owner, now(), now())
    """), {"id": ws_id, "owner": demo_id})

    for user_id, role in [(demo_id, "admin"), (alice_id, "member"), (bob_id, "member")]:
        await session.execute(text("""
            INSERT INTO workspace_memberships
              (id, workspace_id, user_id, role, created_at, updated_at)
            VALUES (:id, :ws, :user, :role, now(), now())
        """), {"id": uuid.uuid4(), "ws": ws_id, "user": user_id, "role": role})

    return {"ws_id": ws_id, "demo_id": demo_id, "alice_id": alice_id, "bob_id": bob_id}
