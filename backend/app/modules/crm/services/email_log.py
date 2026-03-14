import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.email_log import EmailLog
from app.modules.crm.schemas.email_log import SendEmailRequest


def _render_body(body_html: str, merge_values: dict | None) -> str:
    if not merge_values:
        return body_html
    rendered = body_html
    for key, value in merge_values.items():
        rendered = rendered.replace(f"{{{{{key}}}}}", str(value))
    return rendered


async def send_email(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    data: SendEmailRequest,
    user_id: uuid.UUID,
) -> EmailLog:
    from app.modules.crm.services.email_template import get_email_template

    template = await get_email_template(db, data.template_id, workspace_id)
    rendered_body = _render_body(template.body_html, data.merge_values)

    log = EmailLog(
        workspace_id=workspace_id,
        contact_id=data.contact_id,
        deal_id=data.deal_id,
        lead_id=data.lead_id,
        template_id=data.template_id,
        subject=template.subject,
        body=rendered_body,
        direction="sent",
        status="sent",
        sent_at=datetime.now(timezone.utc),
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


async def list_emails(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    contact_id: uuid.UUID | None = None,
    deal_id: uuid.UUID | None = None,
    lead_id: uuid.UUID | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[EmailLog], int]:
    q = select(EmailLog).where(EmailLog.workspace_id == workspace_id)
    count_q = select(func.count(EmailLog.id)).where(EmailLog.workspace_id == workspace_id)

    if contact_id:
        q = q.where(EmailLog.contact_id == contact_id)
        count_q = count_q.where(EmailLog.contact_id == contact_id)
    if deal_id:
        q = q.where(EmailLog.deal_id == deal_id)
        count_q = count_q.where(EmailLog.deal_id == deal_id)
    if lead_id:
        q = q.where(EmailLog.lead_id == lead_id)
        count_q = count_q.where(EmailLog.lead_id == lead_id)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(EmailLog.sent_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def track_email_event(
    db: AsyncSession,
    email_id: uuid.UUID,
    workspace_id: uuid.UUID,
    event: str,
) -> EmailLog:
    result = await db.scalars(
        select(EmailLog).where(
            EmailLog.id == email_id,
            EmailLog.workspace_id == workspace_id,
        )
    )
    log = result.first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email log not found")

    now = datetime.now(timezone.utc)
    if event == "open" and not log.opened_at:
        log.opened_at = now
        log.status = "opened"
    elif event == "click" and not log.clicked_at:
        log.clicked_at = now
        log.status = "clicked"

    await db.commit()
    await db.refresh(log)
    return log
