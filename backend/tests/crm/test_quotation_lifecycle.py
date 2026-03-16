"""Service-layer tests for quotation.py — lifecycle, line math, status transitions."""
import pytest
import pytest_asyncio
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.schemas.quotation import (
    QuotationCreate,
    QuotationLineCreate,
    QuotationLineUpdate,
    QuotationUpdate,
)
from app.modules.crm.services.quotation import (
    accept_quotation,
    add_quotation_line,
    create_quotation,
    delete_quotation_line,
    reject_quotation,
    send_quotation,
    update_quotation_line,
)

from tests.crm.conftest import make_deal, make_workspace


def _line(description="Item", qty=1.0, price=100.0, disc=0.0) -> QuotationLineCreate:
    return QuotationLineCreate(
        description=description, quantity=qty, unit_price=price, discount_pct=disc
    )


@pytest_asyncio.fixture
async def ws(db: AsyncSession):
    return await make_workspace(db)


@pytest_asyncio.fixture
async def deal(db: AsyncSession, ws):
    return await make_deal(db, ws.id)


# --- create_quotation ---


@pytest.mark.asyncio
async def test_create_quotation_with_lines(db: AsyncSession, ws, deal):
    data = QuotationCreate(
        deal_id=deal.id,
        lines=[_line("A", qty=2, price=100), _line("B", qty=1, price=50)],
    )
    q = await create_quotation(db, ws.id, data)
    assert q.subtotal == pytest.approx(250.0)
    assert q.total == pytest.approx(250.0)
    assert len(q.lines) == 2


@pytest.mark.asyncio
async def test_create_quotation_auto_quote_number(db: AsyncSession, ws, deal):
    from datetime import date
    data = QuotationCreate(deal_id=deal.id, lines=[_line()])
    q = await create_quotation(db, ws.id, data)
    today_str = date.today().strftime("%Y%m%d")
    assert q.quote_number.startswith(f"QT-{today_str}-")


@pytest.mark.asyncio
async def test_line_total_discount_calculation(db: AsyncSession, ws, deal):
    # qty=5, price=200, disc=15% → 5*200*0.85 = 850
    data = QuotationCreate(deal_id=deal.id, lines=[_line(qty=5, price=200, disc=15)])
    q = await create_quotation(db, ws.id, data)
    assert q.lines[0].line_total == pytest.approx(850.0)
    assert q.subtotal == pytest.approx(850.0)


@pytest.mark.asyncio
async def test_quotation_with_tax_and_discount(db: AsyncSession, ws, deal):
    # subtotal=1000, disc_pct=10, tax_pct=20 → after_disc=900, tax=180 → total=1080
    data = QuotationCreate(
        deal_id=deal.id,
        discount_pct=10.0,
        tax_pct=20.0,
        lines=[_line(qty=10, price=100)],
    )
    q = await create_quotation(db, ws.id, data)
    assert q.subtotal == pytest.approx(1000.0)
    assert q.discount_amount == pytest.approx(100.0)
    assert q.tax_amount == pytest.approx(180.0)
    assert q.total == pytest.approx(1080.0)


# --- add / update / delete line ---


@pytest.mark.asyncio
async def test_add_line_recalculates_total(db: AsyncSession, ws, deal):
    data = QuotationCreate(deal_id=deal.id, lines=[_line(qty=1, price=100)])
    q = await create_quotation(db, ws.id, data)
    assert q.subtotal == pytest.approx(100.0)

    q2 = await add_quotation_line(
        db, q.id, ws.id, _line("Extra", qty=2, price=50)
    )
    assert q2.subtotal == pytest.approx(200.0)


@pytest.mark.asyncio
async def test_update_line_recalculates(db: AsyncSession, ws, deal):
    data = QuotationCreate(deal_id=deal.id, lines=[_line(qty=1, price=100)])
    q = await create_quotation(db, ws.id, data)
    line_id = q.lines[0].id

    q2 = await update_quotation_line(
        db, line_id, ws.id, QuotationLineUpdate(quantity=3)
    )
    assert q2.subtotal == pytest.approx(300.0)


@pytest.mark.asyncio
async def test_delete_line_recalculates(db: AsyncSession, ws, deal):
    data = QuotationCreate(
        deal_id=deal.id,
        lines=[_line("A", qty=1, price=100), _line("B", qty=1, price=200)],
    )
    q = await create_quotation(db, ws.id, data)
    line_b_id = next(line.id for line in q.lines if line.description == "B")

    q2 = await delete_quotation_line(db, line_b_id, ws.id)
    assert q2.subtotal == pytest.approx(100.0)


# --- send_quotation ---


@pytest.mark.asyncio
async def test_send_quotation_from_draft(db: AsyncSession, ws, deal):
    data = QuotationCreate(deal_id=deal.id, lines=[_line()])
    q = await create_quotation(db, ws.id, data)
    assert q.status == "draft"
    sent = await send_quotation(db, q.id, ws.id)
    assert sent.status == "sent"


@pytest.mark.asyncio
async def test_send_quotation_not_draft_raises(db: AsyncSession, ws, deal):
    data = QuotationCreate(deal_id=deal.id, lines=[_line()])
    q = await create_quotation(db, ws.id, data)
    await send_quotation(db, q.id, ws.id)
    with pytest.raises(HTTPException) as exc:
        await send_quotation(db, q.id, ws.id)
    assert exc.value.status_code == 400


# --- accept_quotation ---


@pytest.mark.asyncio
async def test_accept_from_sent(db: AsyncSession, ws, deal):
    data = QuotationCreate(deal_id=deal.id, lines=[_line(qty=1, price=500)])
    q = await create_quotation(db, ws.id, data)
    await send_quotation(db, q.id, ws.id)
    accepted = await accept_quotation(db, q.id, ws.id)
    assert accepted.status == "accepted"


@pytest.mark.asyncio
async def test_accept_from_draft(db: AsyncSession, ws, deal):
    data = QuotationCreate(deal_id=deal.id, lines=[_line(qty=1, price=300)])
    q = await create_quotation(db, ws.id, data)
    accepted = await accept_quotation(db, q.id, ws.id)
    assert accepted.status == "accepted"


@pytest.mark.asyncio
async def test_accept_quotation_updates_deal_value(db: AsyncSession, ws, deal):
    data = QuotationCreate(deal_id=deal.id, lines=[_line(qty=2, price=750)])
    q = await create_quotation(db, ws.id, data)
    await accept_quotation(db, q.id, ws.id)
    await db.refresh(deal)
    assert deal.value == pytest.approx(1500.0)


# --- reject_quotation ---


@pytest.mark.asyncio
async def test_reject_quotation(db: AsyncSession, ws, deal):
    data = QuotationCreate(deal_id=deal.id, lines=[_line()])
    q = await create_quotation(db, ws.id, data)
    await send_quotation(db, q.id, ws.id)
    rejected = await reject_quotation(db, q.id, ws.id)
    assert rejected.status == "rejected"


@pytest.mark.asyncio
async def test_reject_accepted_raises(db: AsyncSession, ws, deal):
    data = QuotationCreate(deal_id=deal.id, lines=[_line()])
    q = await create_quotation(db, ws.id, data)
    await accept_quotation(db, q.id, ws.id)
    with pytest.raises(HTTPException) as exc:
        await reject_quotation(db, q.id, ws.id)
    assert exc.value.status_code == 400
