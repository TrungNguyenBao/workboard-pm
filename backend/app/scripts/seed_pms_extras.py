"""Seed PMS extras: tag assignments, comments, goals, followers."""
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.scripts.seed_shared import days, now_utc


async def seed_pms_extras(
    session: AsyncSession,
    ws_id: uuid.UUID,
    ctx: dict,
    task_ids: dict,
    demo_id: uuid.UUID,
    alice_id: uuid.UUID,
    bob_id: uuid.UUID,
) -> None:
    tag_ids = ctx["tag_ids"]
    projects = ctx["projects"]

    # TAG ASSIGNMENTS
    print("Assigning tags to tasks...")
    tag_assignments = [
        (task_ids["wr3"], "backend"), (task_ids["wr4"], "design"),
        (task_ids["wr4"], "urgent"), (task_ids["mob3"], "backend"),
        (task_ids["mob3"], "urgent"), (task_ids["mob4"], "feature"),
        (task_ids["mkt1"], "feature"), (task_ids["mkt3"], "urgent"),
    ]
    for task_id, tag_name in tag_assignments:
        await session.execute(text("""
            INSERT INTO task_tags (task_id, tag_id)
            VALUES (:task, :tag) ON CONFLICT DO NOTHING
        """), {"task": task_id, "tag": tag_ids[tag_name]})

    # COMMENTS
    print("Creating comments...")
    comments = [
        (task_ids["wr4"], alice_id,
         "<p>I've started the token setup but the typography scale still needs sign-off from the brand team.</p>",
         "I've started the token setup but the typography scale still needs sign-off from the brand team."),
        (task_ids["wr4"], demo_id,
         "<p>Let's schedule a quick review call tomorrow at 10 AM to unblock you.</p>",
         "Let's schedule a quick review call tomorrow at 10 AM to unblock you."),
        (task_ids["mob3"], bob_id,
         "<p>FCM is integrated for Android. APNs needs the renewed certificate from the Apple Developer portal.</p>",
         "FCM is integrated for Android. APNs needs the renewed certificate from the Apple Developer portal."),
        (task_ids["mkt1"], alice_id,
         "<p>Draft calendar is in Google Sheets — sharing link with everyone now.</p>",
         "Draft calendar is in Google Sheets — sharing link with everyone now."),
        (task_ids["wr1"], demo_id,
         "<p>Reference architecture from Nielsen Norman Group attached as inspiration.</p>",
         "Reference architecture from Nielsen Norman Group attached as inspiration."),
    ]
    for task_id, author_id, body, body_text in comments:
        await session.execute(text("""
            INSERT INTO comments
              (id, task_id, author_id, body, body_text, created_at, updated_at)
            VALUES (:id, :task, :author, :body, :bt, now(), now())
        """), {
            "id": uuid.uuid4(), "task": task_id,
            "author": author_id, "body": body, "bt": body_text,
        })

    # GOALS
    print("Creating goals...")
    now = now_utc()
    g1, g2 = uuid.uuid4(), uuid.uuid4()
    await session.execute(text("""
        INSERT INTO goals
          (id, workspace_id, owner_id, title, description, status,
           progress_value, calculation_method, color, due_date,
           created_at, updated_at)
        VALUES
          (:id1, :ws, :owner, 'Launch Website v2',
           'Ship the redesigned public website to production by end of Q1.',
           'on_track', 40.0, 'auto', '#5E6AD2', :due1, now(), now()),
          (:id2, :ws, :owner, 'Ship Mobile MVP',
           'Release the iOS and Android app to the stores with core feature set.',
           'at_risk', 35.0, 'manual', '#F59E0B', :due2, now(), now())
    """), {
        "id1": g1, "id2": g2, "ws": ws_id, "owner": demo_id,
        "due1": now + days(60), "due2": now + days(90),
    })

    await session.execute(text("""
        INSERT INTO goal_project_links (goal_id, project_id, created_at)
        VALUES (:g1, :p1, now()), (:g2, :p2, now())
    """), {
        "g1": g1, "p1": projects["Agile Software Dev"],
        "g2": g2, "p2": projects["Social Media Kanban"],
    })

    # FOLLOWERS
    print("Adding task followers...")
    for task_id in [task_ids["wr4"], task_ids["mob3"], task_ids["mkt3"]]:
        await session.execute(text("""
            INSERT INTO task_followers (task_id, user_id)
            VALUES (:task, :user) ON CONFLICT DO NOTHING
        """), {"task": task_id, "user": demo_id})
