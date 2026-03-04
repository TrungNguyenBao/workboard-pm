"""Seed PMS structure: tags, projects, sections, custom fields."""
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def seed_pms_structure(
    session: AsyncSession,
    ws_id: uuid.UUID,
    demo_id: uuid.UUID,
    alice_id: uuid.UUID,
    bob_id: uuid.UUID,
) -> dict:
    """Create tags, projects, sections, custom fields. Returns context dict."""
    # TAGS
    print("Creating tags...")
    tag_data = [
        ("bug", "#EF4444"), ("feature", "#3B82F6"), ("urgent", "#F59E0B"),
        ("design", "#8B5CF6"), ("backend", "#10B981"),
    ]
    tag_ids: dict[str, uuid.UUID] = {}
    for name, color in tag_data:
        tid = uuid.uuid4()
        tag_ids[name] = tid
        await session.execute(text("""
            INSERT INTO tags (id, workspace_id, name, color, created_at, updated_at)
            VALUES (:id, :ws, :name, :color, now(), now())
        """), {"id": tid, "ws": ws_id, "name": name, "color": color})

    # PROJECTS
    print("Creating projects...")
    projects: dict[str, uuid.UUID] = {}
    project_defs = [
        ("Website Redesign", "#5E6AD2", "Complete overhaul of company website"),
        ("Mobile App", "#F59E0B", "iOS and Android app development"),
        ("Q1 Marketing", "#10B981", "Q1 marketing campaigns and content"),
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
        for uid, role in [(demo_id, "owner"), (alice_id, "editor"), (bob_id, "editor")]:
            await session.execute(text("""
                INSERT INTO project_memberships
                  (id, project_id, user_id, role, created_at, updated_at)
                VALUES (:id, :proj, :user, :role, now(), now())
            """), {"id": uuid.uuid4(), "proj": pid, "user": uid, "role": role})

    # SECTIONS (3 per project)
    print("Creating sections...")
    section_names = ["To Do", "In Progress", "Done"]
    sections: dict[tuple[str, str], uuid.UUID] = {}
    for proj_name, proj_id in projects.items():
        for idx, sec_name in enumerate(section_names):
            sid = uuid.uuid4()
            sections[(proj_name, sec_name)] = sid
            await session.execute(text("""
                INSERT INTO sections
                  (id, project_id, name, position, created_at, updated_at)
                VALUES (:id, :proj, :name, :pos, now(), now())
            """), {"id": sid, "proj": proj_id, "name": sec_name, "pos": float((idx + 1) * 65536)})

    # CUSTOM FIELDS (Website Redesign only)
    print("Creating custom field definitions...")
    wr_id = projects["Website Redesign"]
    cf_story = uuid.uuid4()
    cf_sprint = uuid.uuid4()
    cf_reviewed = uuid.uuid4()
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
        "id1": cf_story, "id2": cf_sprint, "id3": cf_reviewed,
        "proj": wr_id, "user": demo_id,
    })

    return {
        "tag_ids": tag_ids, "projects": projects, "sections": sections,
        "demo_id": demo_id, "alice_id": alice_id, "bob_id": bob_id,
        "cf_story": cf_story, "cf_sprint": cf_sprint, "cf_reviewed": cf_reviewed,
    }
