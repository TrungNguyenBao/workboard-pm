"""Recurring task logic: validation, date calculation, and occurrence spawning."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate

VALID_RULES = {"daily", "weekly", "biweekly", "monthly", "custom_cron"}

RULE_INTERVALS: dict[str, timedelta] = {
    "daily": timedelta(days=1),
    "weekly": timedelta(weeks=1),
    "biweekly": timedelta(weeks=2),
    "monthly": timedelta(days=30),  # approximate; croniter used for exact monthly
}


def validate_recurrence(data: TaskCreate | TaskUpdate) -> None:
    """Raise HTTPException 422 if recurrence fields are invalid."""
    rule = data.recurrence_rule
    if rule is None:
        return
    if rule not in VALID_RULES:
        raise HTTPException(
            status_code=422,
            detail=f"recurrence_rule must be one of: {', '.join(sorted(VALID_RULES))}",
        )
    if rule == "custom_cron":
        expr = data.recurrence_cron_expr
        if not expr:
            raise HTTPException(
                status_code=422,
                detail="recurrence_cron_expr is required when recurrence_rule is 'custom_cron'",
            )
        # Validate cron expression via croniter
        try:
            from croniter import croniter  # type: ignore[import]
            if not croniter.is_valid(expr):
                raise HTTPException(status_code=422, detail=f"Invalid cron expression: {expr}")
        except ImportError:
            pass  # croniter not installed; skip validation


def calculate_next_due(task: Task) -> datetime | None:
    """Return the next due_date for a recurring template task, or None if past end_date."""
    if not task.recurrence_rule or not task.due_date:
        return None

    base = task.last_generated_date or task.due_date
    now = datetime.now(timezone.utc)

    if task.recurrence_rule == "custom_cron" and task.recurrence_cron_expr:
        try:
            from croniter import croniter  # type: ignore[import]
            cron = croniter(task.recurrence_cron_expr, base)
            next_dt = cron.get_next(datetime)
        except Exception:
            return None
    elif task.recurrence_rule in RULE_INTERVALS:
        next_dt = base + RULE_INTERVALS[task.recurrence_rule]
    else:
        return None

    # Ensure timezone-aware
    if next_dt.tzinfo is None:
        next_dt = next_dt.replace(tzinfo=timezone.utc)

    # Already beyond end_date → stop
    if task.recurrence_end_date and next_dt > task.recurrence_end_date:
        return None

    # Not yet due (next occurrence is in the future; only spawn if <= now)
    if next_dt > now:
        return None

    return next_dt


async def spawn_occurrence(db: AsyncSession, template: Task) -> Task:
    """Copy a template task into a new occurrence with parent_recurring_id set."""
    next_due = calculate_next_due(template)
    if next_due is None:
        raise ValueError("No due date to spawn for this template")

    occurrence = Task(
        project_id=template.project_id,
        section_id=template.section_id,
        assignee_id=template.assignee_id,
        created_by_id=template.created_by_id,
        parent_id=template.parent_id,
        title=template.title,
        description=template.description,
        priority=template.priority,
        position=template.position,
        due_date=next_due,
        start_date=template.start_date,
        parent_recurring_id=template.id,
        status="incomplete",
    )
    db.add(occurrence)

    # Update template's last_generated_date to prevent duplicate spawns
    template.last_generated_date = next_due
    await db.flush()
    return occurrence


async def spawn_all_due(db: AsyncSession) -> int:
    """Query all template tasks due for a new occurrence and spawn them. Returns count."""
    # Templates: have recurrence_rule set and no parent_recurring_id
    result = await db.scalars(
        select(Task).where(
            Task.recurrence_rule.isnot(None),
            Task.parent_recurring_id.is_(None),
            Task.deleted_at.is_(None),
        )
    )
    templates = list(result.all())

    count = 0
    for template in templates:
        try:
            next_due = calculate_next_due(template)
            if next_due is None:
                continue
            await spawn_occurrence(db, template)
            count += 1
        except Exception:
            continue  # skip individual failures; log in production

    if count:
        await db.commit()

    return count
