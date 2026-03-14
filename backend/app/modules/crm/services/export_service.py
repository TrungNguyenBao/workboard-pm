import csv
import io
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.contact import Contact
from app.modules.crm.models.deal import Deal
from app.modules.crm.models.lead import Lead


async def export_leads_csv(db: AsyncSession, workspace_id: uuid.UUID) -> str:
    leads = list((await db.scalars(
        select(Lead).where(Lead.workspace_id == workspace_id).order_by(Lead.created_at.desc())
    )).all())

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "name", "email", "phone", "source", "status", "score", "created_at"])
    for lead in leads:
        writer.writerow([
            str(lead.id),
            lead.name,
            lead.email or "",
            lead.phone or "",
            lead.source,
            lead.status,
            lead.score,
            lead.created_at.isoformat() if lead.created_at else "",
        ])
    return output.getvalue()


async def export_contacts_csv(db: AsyncSession, workspace_id: uuid.UUID) -> str:
    contacts = list((await db.scalars(
        select(Contact).where(Contact.workspace_id == workspace_id).order_by(Contact.created_at.desc())
    )).all())

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "name", "email", "phone", "company", "created_at"])
    for contact in contacts:
        writer.writerow([
            str(contact.id),
            contact.name,
            contact.email or "",
            contact.phone or "",
            contact.company or "",
            contact.created_at.isoformat() if contact.created_at else "",
        ])
    return output.getvalue()


async def export_pipeline_csv(db: AsyncSession, workspace_id: uuid.UUID) -> str:
    deals = list((await db.scalars(
        select(Deal).where(Deal.workspace_id == workspace_id).order_by(Deal.created_at.desc())
    )).all())

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "title", "value", "stage", "probability",
        "owner_id", "expected_close_date", "closed_at", "created_at",
    ])
    for deal in deals:
        writer.writerow([
            str(deal.id),
            deal.title,
            deal.value,
            deal.stage,
            deal.probability,
            str(deal.owner_id) if deal.owner_id else "",
            deal.expected_close_date.isoformat() if deal.expected_close_date else "",
            deal.closed_at.isoformat() if deal.closed_at else "",
            deal.created_at.isoformat() if deal.created_at else "",
        ])
    return output.getvalue()
