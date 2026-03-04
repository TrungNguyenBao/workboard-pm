"""Seed PMS tasks: 18 tasks (including 3 subtasks) across 3 projects."""
import json
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.scripts.seed_shared import days, now_utc


async def _ins(
    session: AsyncSession, ctx: dict,
    *, proj: str, sec: str, title: str, desc: str | None = None,
    status: str = "incomplete", pri: str = "none",
    assignee: uuid.UUID | None = None, start=None, due=None,
    rec_rule: str | None = None, rec_cron: str | None = None,
    parent: uuid.UUID | None = None, cf: dict | None = None, pos: float = 65536.0,
) -> uuid.UUID:
    tid = uuid.uuid4()
    await session.execute(text("""
        INSERT INTO tasks
          (id, project_id, section_id, assignee_id, created_by_id, parent_id,
           title, description, status, priority, position,
           start_date, due_date, completed_at,
           recurrence_rule, recurrence_cron_expr, custom_fields, created_at, updated_at)
        VALUES
          (:id, :proj, :sec, :a, :c, :p, :title, :desc, :st, :pri, :pos,
           :start, :due, :comp, :rr, :rc, :cf, now(), now())
    """), {
        "id": tid, "proj": ctx["projects"][proj], "sec": ctx["sections"][(proj, sec)],
        "a": assignee, "c": ctx["demo_id"], "p": parent,
        "title": title, "desc": desc, "st": status, "pri": pri, "pos": pos,
        "start": start, "due": due, "comp": now_utc() if status == "completed" else None,
        "rr": rec_rule, "rc": rec_cron, "cf": json.dumps(cf) if cf else None,
    })
    return tid


async def seed_pms_tasks(session: AsyncSession, ctx: dict) -> dict:
    """Create all PMS tasks. Returns dict of task IDs needed by extras."""
    print("Creating tasks...")
    now = now_utc()
    a, b, d = ctx["alice_id"], ctx["bob_id"], ctx["demo_id"]
    cs, cp, cr = str(ctx["cf_story"]), str(ctx["cf_sprint"]), str(ctx["cf_reviewed"])

    # --- Website Redesign ---
    wr1 = await _ins(session, ctx, proj="Website Redesign", sec="To Do",
        title="Define new information architecture",
        desc="Map all existing pages and propose new site structure.",
        pri="high", assignee=a, start=now + days(1), due=now + days(10),
        cf={cs: 8, cp: "Sprint 1", cr: False})
    wr2 = await _ins(session, ctx, proj="Website Redesign", sec="To Do",
        title="Create wireframes for homepage",
        desc="Design low-fidelity wireframes for desktop and mobile breakpoints.",
        pri="high", assignee=a, due=now + days(14),
        cf={cs: 5, cp: "Sprint 1", cr: False}, pos=131072.0)
    wr3 = await _ins(session, ctx, proj="Website Redesign", sec="In Progress",
        title="Audit current website performance",
        desc="Run Lighthouse and identify Core Web Vitals issues.",
        pri="medium", assignee=d, start=now - days(3), due=now + days(2),
        cf={cs: 3, cp: "Sprint 1", cr: False})
    wr4 = await _ins(session, ctx, proj="Website Redesign", sec="In Progress",
        title="Set up design system in Figma",
        desc="Establish tokens: colors, spacing, typography, and component library.",
        pri="urgent", assignee=a, start=now - days(5), due=now - days(1),
        cf={cs: 13, cp: "Sprint 2", cr: False}, pos=131072.0)
    await _ins(session, ctx, proj="Website Redesign", sec="Done",
        title="Kick-off meeting with stakeholders", status="completed",
        assignee=d, due=now - days(14),
        cf={cs: 1, cp: "Sprint 1", cr: True})
    await _ins(session, ctx, proj="Website Redesign", sec="Done",
        title="Collect brand assets from marketing", status="completed",
        pri="low", assignee=b, due=now - days(7),
        cf={cs: 2, cp: "Sprint 1", cr: True}, pos=131072.0)
    # Subtasks for wr2
    await _ins(session, ctx, proj="Website Redesign", sec="To Do",
        title="Research competitor homepage layouts", pri="medium", parent=wr2)
    await _ins(session, ctx, proj="Website Redesign", sec="To Do",
        title="Sketch initial mobile navigation concepts", pri="medium",
        parent=wr2, pos=131072.0)

    # --- Mobile App ---
    await _ins(session, ctx, proj="Mobile App", sec="To Do",
        title="Set up React Native project",
        desc="Initialise monorepo with Expo, configure ESLint and TypeScript.",
        pri="high", assignee=b, start=now + days(2), due=now + days(7))
    await _ins(session, ctx, proj="Mobile App", sec="To Do",
        title="Design authentication screens",
        desc="Login, Sign-up, Forgot password and OTP screens.",
        pri="high", assignee=a, due=now + days(12), pos=131072.0)
    mob3 = await _ins(session, ctx, proj="Mobile App", sec="In Progress",
        title="Implement push notification service",
        desc="Integrate Firebase Cloud Messaging for iOS and Android.",
        pri="medium", assignee=b, start=now - days(4), due=now + days(5),
        rec_rule="weekly", rec_cron="0 9 * * 1")
    mob4 = await _ins(session, ctx, proj="Mobile App", sec="In Progress",
        title="Build task list screen",
        desc="Port web task list to native with swipe actions.",
        pri="high", assignee=b, start=now - days(2), due=now + days(8), pos=131072.0)
    await _ins(session, ctx, proj="Mobile App", sec="Done",
        title="Write technical specification doc", status="completed",
        assignee=d, due=now - days(20))
    # Subtask for mob3
    await _ins(session, ctx, proj="Mobile App", sec="In Progress",
        title="Configure APNs certificates for iOS", pri="high", parent=mob3)

    # --- Q1 Marketing ---
    mkt1 = await _ins(session, ctx, proj="Q1 Marketing", sec="To Do",
        title="Plan social media content calendar",
        desc="Schedule 3 posts/week across LinkedIn, Twitter, and Instagram.",
        pri="medium", assignee=a, start=now + days(1), due=now + days(5),
        rec_rule="daily", rec_cron="0 8 * * *")
    await _ins(session, ctx, proj="Q1 Marketing", sec="To Do",
        title="Write Q1 product launch blog post",
        pri="high", assignee=a, due=now + days(20), pos=131072.0)
    mkt3 = await _ins(session, ctx, proj="Q1 Marketing", sec="In Progress",
        title="Set up email drip campaign",
        desc="Configure Mailchimp sequences for new trial sign-ups.",
        pri="high", assignee=b, start=now - days(6), due=now + days(3))
    await _ins(session, ctx, proj="Q1 Marketing", sec="Done",
        title="Competitor analysis report", status="completed",
        pri="low", assignee=d, due=now - days(10))
    await _ins(session, ctx, proj="Q1 Marketing", sec="Done",
        title="Define Q1 OKRs", status="completed",
        pri="urgent", assignee=d, due=now - days(30), pos=131072.0)

    return {"wr1": wr1, "wr3": wr3, "wr4": wr4, "mob3": mob3, "mob4": mob4, "mkt1": mkt1, "mkt3": mkt3}
