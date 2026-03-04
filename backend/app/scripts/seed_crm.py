"""Seed CRM: contacts and deals."""
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def seed_crm(session: AsyncSession, ws_id: uuid.UUID) -> None:
    print("Creating CRM contacts...")

    crm_contact_data = [
        ("Sophia Turner",    "sophia.turner@acmecorp.com",  "+1-415-555-0101", "Acme Corp"),
        ("James Whitfield",  "j.whitfield@nexatech.io",     "+1-212-555-0202", "NexaTech"),
        ("Priya Nair",       "priya@brightwave.co",         "+44-20-5555-0303", "BrightWave"),
        ("Carlos Mendez",    "carlos.mendez@velocloud.net", "+34-91-555-0404", "VeloCloud"),
        ("Aiko Yamamoto",    "aiko@tokyoventures.jp",       "+81-3-5555-0505", "Tokyo Ventures"),
        ("Elena Vasquez",    "elena.v@quantumleap.io",      "+1-650-555-0606", "QuantumLeap"),
        ("Marcus Klein",     "m.klein@alphasoft.de",        "+49-30-5555-0707", "AlphaSoft"),
        ("Isabelle Moreau",  "i.moreau@labelletech.fr",     "+33-1-5555-0808", "LaBelleTech"),
        ("Raj Patel",        "raj.patel@inditech.in",       "+91-22-5555-0909", "IndiTech"),
        ("Omar Hassan",      "omar@sandstormio.ae",         "+971-4-555-1010", "Sandstorm IO"),
    ]

    contact_ids: list[uuid.UUID] = []
    for name, email, phone, company in crm_contact_data:
        cid = uuid.uuid4()
        contact_ids.append(cid)
        await session.execute(text("""
            INSERT INTO contacts (id, workspace_id, name, email, phone, company, created_at, updated_at)
            VALUES (:id, :ws, :name, :email, :phone, :company, now(), now())
        """), {"id": cid, "ws": ws_id, "name": name, "email": email, "phone": phone, "company": company})

    print("Creating CRM deals...")

    crm_deal_data = [
        # (title, value, stage, contact_index)
        ("Enterprise License — NexaTech",        48000.0,  "negotiation",  1),
        ("Cloud Migration Package — VeloCloud",  125000.0, "proposal",     3),
        ("Starter Plan — BrightWave",            3200.0,   "closed_won",   2),
        ("Annual SaaS Contract — QuantumLeap",   72000.0,  "qualified",    5),
        ("Pilot Program — Tokyo Ventures",       9500.0,   "lead",         4),
        ("Premium Support — AlphaSoft",          18000.0,  "closed_won",   6),
        ("Integration Services — IndiTech",      34000.0,  "proposal",     8),
        ("Consulting Retainer — Sandstorm IO",   60000.0,  "negotiation",  9),
        ("Basic Tier — LaBelleTech",             2400.0,   "lead",         7),
        ("Renewal — Acme Corp",                  95000.0,  "closed_won",   0),
        ("Upsell — NexaTech Pro",                22000.0,  "qualified",    1),
        ("Trial Conversion — BrightWave",        5800.0,   "closed_lost",  2),
    ]

    for title, value, stage, contact_idx in crm_deal_data:
        await session.execute(text("""
            INSERT INTO deals (id, workspace_id, contact_id, title, value, stage, created_at, updated_at)
            VALUES (:id, :ws, :contact, :title, :value, :stage, now(), now())
        """), {
            "id": uuid.uuid4(),
            "ws": ws_id,
            "contact": contact_ids[contact_idx],
            "title": title,
            "value": value,
            "stage": stage,
        })

    print(f"  CRM: {len(crm_contact_data)} contacts, {len(crm_deal_data)} deals")
