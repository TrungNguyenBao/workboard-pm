"""CRM-specific test fixtures and factory functions."""
import uuid
from datetime import date, datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.workspace import Workspace
from app.modules.crm.models.account import Account
from app.modules.crm.models.activity import Activity
from app.modules.crm.models.campaign import Campaign
from app.modules.crm.models.contact import Contact
from app.modules.crm.models.contract import Contract
from app.modules.crm.models.deal import Deal
from app.modules.crm.models.lead import Lead
from app.modules.crm.models.product_service import ProductService
from app.modules.crm.models.quotation import Quotation
from app.modules.crm.models.quotation_line import QuotationLine
from app.modules.crm.models.ticket import Ticket


async def make_user(db: AsyncSession, email: str = "test@test.com") -> User:
    unique_email = f"{uuid.uuid4().hex[:8]}_{email}"
    user = User(
        name="Test User",
        email=unique_email,
        hashed_password="hashed_password_placeholder",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def make_workspace(db: AsyncSession, owner_id: uuid.UUID | None = None) -> Workspace:
    if owner_id is None:
        user = await make_user(db, email="owner@workspace.com")
        owner_id = user.id
    ws = Workspace(
        name="Test Workspace",
        slug=f"test-ws-{uuid.uuid4().hex[:8]}",
        owner_id=owner_id,
    )
    db.add(ws)
    await db.commit()
    await db.refresh(ws)
    return ws


async def make_lead(db: AsyncSession, workspace_id: uuid.UUID, **overrides) -> Lead:
    defaults = {
        "name": "Test Lead",
        "email": f"lead-{uuid.uuid4().hex[:8]}@example.com",
        "source": "manual",
        "status": "new",
        "score": 0,
        "workspace_id": workspace_id,
    }
    defaults.update(overrides)
    lead = Lead(**defaults)
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return lead


async def make_deal(db: AsyncSession, workspace_id: uuid.UUID, **overrides) -> Deal:
    defaults = {
        "title": "Test Deal",
        "value": 1000.0,
        "stage": "lead",
        "probability": 5.0,
        "workspace_id": workspace_id,
    }
    defaults.update(overrides)
    deal = Deal(**defaults)
    db.add(deal)
    await db.commit()
    await db.refresh(deal)
    return deal


async def make_account(db: AsyncSession, workspace_id: uuid.UUID, **overrides) -> Account:
    defaults = {
        "name": "Test Account",
        "status": "active",
        "workspace_id": workspace_id,
    }
    defaults.update(overrides)
    account = Account(**defaults)
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account


async def make_contact(db: AsyncSession, workspace_id: uuid.UUID, **overrides) -> Contact:
    defaults = {
        "name": "Test Contact",
        "email": f"contact-{uuid.uuid4().hex[:8]}@example.com",
        "workspace_id": workspace_id,
    }
    defaults.update(overrides)
    contact = Contact(**defaults)
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return contact


async def make_activity(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    lead_id: uuid.UUID | None = None,
    deal_id: uuid.UUID | None = None,
    **overrides,
) -> Activity:
    defaults = {
        "type": "call",
        "subject": "Test Activity",
        "date": datetime.now(timezone.utc),
        "workspace_id": workspace_id,
        "lead_id": lead_id,
        "deal_id": deal_id,
    }
    defaults.update(overrides)
    activity = Activity(**defaults)
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    return activity


async def make_campaign(db: AsyncSession, workspace_id: uuid.UUID, **overrides) -> Campaign:
    defaults = {
        "name": "Test Campaign",
        "type": "email",
        "status": "draft",
        "workspace_id": workspace_id,
    }
    defaults.update(overrides)
    campaign = Campaign(**defaults)
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return campaign


async def make_ticket(
    db: AsyncSession, workspace_id: uuid.UUID, account_id: uuid.UUID, **overrides
) -> Ticket:
    defaults = {
        "subject": "Test Ticket",
        "status": "open",
        "priority": "medium",
        "account_id": account_id,
        "workspace_id": workspace_id,
    }
    defaults.update(overrides)
    ticket = Ticket(**defaults)
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return ticket


async def make_quotation(
    db: AsyncSession, deal_id: uuid.UUID, workspace_id: uuid.UUID, **overrides
) -> Quotation:
    defaults = {
        "deal_id": deal_id,
        "quote_number": f"QT-{uuid.uuid4().hex[:8]}",
        "status": "draft",
        "discount_pct": 0.0,
        "tax_pct": 0.0,
        "subtotal": 0.0,
        "discount_amount": 0.0,
        "tax_amount": 0.0,
        "total": 0.0,
        "workspace_id": workspace_id,
    }
    defaults.update(overrides)
    quotation = Quotation(**defaults)
    db.add(quotation)
    await db.commit()
    await db.refresh(quotation)
    return quotation


async def make_quotation_line(
    db: AsyncSession, quotation_id: uuid.UUID, workspace_id: uuid.UUID, **overrides
) -> QuotationLine:
    defaults = {
        "quotation_id": quotation_id,
        "description": "Test Line Item",
        "quantity": 1.0,
        "unit_price": 100.0,
        "discount_pct": 0.0,
        "line_total": 100.0,
        "position": 0,
        "workspace_id": workspace_id,
    }
    defaults.update(overrides)
    line = QuotationLine(**defaults)
    db.add(line)
    await db.commit()
    await db.refresh(line)
    return line


async def make_product_service(
    db: AsyncSession, workspace_id: uuid.UUID, **overrides
) -> ProductService:
    defaults = {
        "name": "Test Product",
        "code": f"PROD-{uuid.uuid4().hex[:6].upper()}",
        "type": "product",
        "unit_price": 100.0,
        "workspace_id": workspace_id,
    }
    defaults.update(overrides)
    product = ProductService(**defaults)
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


async def make_contract(
    db: AsyncSession, account_id: uuid.UUID, workspace_id: uuid.UUID, **overrides
) -> Contract:
    defaults = {
        "account_id": account_id,
        "contract_number": f"CT-{uuid.uuid4().hex[:8]}",
        "title": "Test Contract",
        "start_date": date.today(),
        "value": 5000.0,
        "status": "draft",
        "workspace_id": workspace_id,
    }
    defaults.update(overrides)
    contract = Contract(**defaults)
    db.add(contract)
    await db.commit()
    await db.refresh(contract)
    return contract
