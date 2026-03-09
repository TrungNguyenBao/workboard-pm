"""ARQ background job definitions."""
from __future__ import annotations

from app.core.config import settings


async def send_due_reminders(ctx: dict) -> int:
    """Job: notify users of tasks due within 24 hours."""
    from datetime import datetime, timedelta, timezone

    from sqlalchemy import select

    from app.core.database import AsyncSessionLocal
    from app.modules.pms.models.task import Task, TaskFollower
    from app.services.notifications import create_notification

    now = datetime.now(timezone.utc)
    window = now + timedelta(hours=24)
    count = 0

    async with AsyncSessionLocal() as db:
        tasks = await db.scalars(
            select(Task).where(
                Task.due_date.between(now, window),
                Task.status == "incomplete",
                Task.deleted_at.is_(None),
            )
        )
        for task in tasks.all():
            followers = await db.scalars(
                select(TaskFollower).where(TaskFollower.task_id == task.id)
            )
            for follower in followers.all():
                await create_notification(
                    db,
                    user_id=follower.user_id,
                    actor_id=None,
                    type="due_soon",
                    title=f'Task "{task.title}" is due soon',
                    resource_type="task",
                    resource_id=task.id,
                )
                count += 1
    return count


async def spawn_recurring_tasks(ctx: dict) -> int:
    """Job: spawn new occurrences for all due recurring template tasks."""
    from app.core.database import AsyncSessionLocal
    from app.modules.pms.services.recurring_tasks import spawn_all_due

    async with AsyncSessionLocal() as db:
        return await spawn_all_due(db)


async def send_hrm_notification(ctx: dict, to_email: str, subject: str, body: str) -> None:
    """ARQ background job: send an HRM email notification."""
    from app.modules.hrm.services.email_notifications import send_email
    await send_email(to_email, subject, body)


class WorkerSettings:
    redis_settings = None  # set dynamically
    functions = [send_due_reminders, spawn_recurring_tasks, send_hrm_notification]

    @classmethod
    def from_config(cls):
        import arq
        from arq import cron
        cls.redis_settings = arq.connections.RedisSettings.from_dsn(settings.REDIS_URL)
        cls.cron_jobs = [
            cron(send_due_reminders, hour=8, minute=0),
            cron(spawn_recurring_tasks, hour=2, minute=0),
        ]
        return cls
