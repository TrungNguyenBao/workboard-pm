"""Seed PMS: tags, projects, sections, custom fields, tasks, comments, goals."""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.scripts.seed_pms_extras import seed_pms_extras
from app.scripts.seed_pms_setup import seed_pms_structure
from app.scripts.seed_pms_tasks import seed_pms_tasks


async def seed_pms(
    session: AsyncSession,
    ws_id: uuid.UUID,
    demo_id: uuid.UUID,
    alice_id: uuid.UUID,
    bob_id: uuid.UUID,
) -> None:
    ctx = await seed_pms_structure(session, ws_id, demo_id, alice_id, bob_id)
    task_ids = await seed_pms_tasks(session, ctx)
    await seed_pms_extras(session, ws_id, ctx, task_ids, demo_id, alice_id, bob_id)
    print(
        "  PMS: 3 projects, 9 sections, 3 custom fields, "
        "18 tasks (3 subtasks), 5 comments, 2 goals, 5 tags"
    )
