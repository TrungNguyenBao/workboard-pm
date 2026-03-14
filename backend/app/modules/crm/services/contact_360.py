import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.services.contact import get_contact


async def get_contact_360(
    db: AsyncSession, contact_id: uuid.UUID, workspace_id: uuid.UUID
) -> dict:
    """Return contact with linked deals, activities, emails, and tickets."""
    from app.modules.crm.models.activity import Activity
    from app.modules.crm.models.deal import Deal
    from app.modules.crm.models.email_log import EmailLog
    from app.modules.crm.models.ticket import Ticket

    contact = await get_contact(db, contact_id, workspace_id)

    deals = list(
        (
            await db.scalars(
                select(Deal).where(
                    Deal.contact_id == contact_id,
                    Deal.workspace_id == workspace_id,
                )
            )
        ).all()
    )

    activities = list(
        (
            await db.scalars(
                select(Activity)
                .where(
                    Activity.contact_id == contact_id,
                    Activity.workspace_id == workspace_id,
                )
                .order_by(Activity.date.desc())
                .limit(50)
            )
        ).all()
    )

    emails = list(
        (
            await db.scalars(
                select(EmailLog).where(
                    EmailLog.contact_id == contact_id,
                    EmailLog.workspace_id == workspace_id,
                )
                .order_by(EmailLog.sent_at.desc())
                .limit(50)
            )
        ).all()
    )

    tickets = list(
        (
            await db.scalars(
                select(Ticket).where(
                    Ticket.contact_id == contact_id,
                    Ticket.workspace_id == workspace_id,
                )
            )
        ).all()
    )

    return {
        "contact": contact,
        "deals": deals,
        "activities": activities,
        "emails": emails,
        "tickets": tickets,
    }
