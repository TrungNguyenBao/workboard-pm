"""Unit tests for quotation calculation logic in quotation.py."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.services.quotation import _calc_line_total, _recalculate
from tests.crm.conftest import make_workspace, make_deal, make_quotation, make_quotation_line


# --- _calc_line_total: pure function ---

class TestCalcLineTotal:
    def test_no_discount(self):
        assert _calc_line_total(2.0, 100.0, 0.0) == pytest.approx(200.0)

    def test_50_percent_discount(self):
        assert _calc_line_total(1.0, 200.0, 50.0) == pytest.approx(100.0)

    def test_100_percent_discount(self):
        assert _calc_line_total(5.0, 100.0, 100.0) == pytest.approx(0.0)

    def test_fractional_discount(self):
        # 10 * 100 * (1 - 10/100) = 900
        assert _calc_line_total(10.0, 100.0, 10.0) == pytest.approx(900.0)

    def test_zero_quantity(self):
        assert _calc_line_total(0.0, 100.0, 0.0) == pytest.approx(0.0)

    def test_zero_price(self):
        assert _calc_line_total(5.0, 0.0, 0.0) == pytest.approx(0.0)


# --- _recalculate: async DB function ---

async def test_recalculate_single_line_no_discount_no_tax(db: AsyncSession):
    ws = await make_workspace(db)
    deal = await make_deal(db, ws.id)
    quote = await make_quotation(db, deal.id, ws.id, discount_pct=0.0, tax_pct=0.0)
    await make_quotation_line(db, quote.id, ws.id, quantity=3.0, unit_price=50.0, discount_pct=0.0, line_total=150.0)

    await _recalculate(db, quote)

    assert quote.subtotal == pytest.approx(150.0)
    assert quote.discount_amount == pytest.approx(0.0)
    assert quote.tax_amount == pytest.approx(0.0)
    assert quote.total == pytest.approx(150.0)


async def test_recalculate_multiple_lines_sum(db: AsyncSession):
    ws = await make_workspace(db)
    deal = await make_deal(db, ws.id)
    quote = await make_quotation(db, deal.id, ws.id, discount_pct=0.0, tax_pct=0.0)
    await make_quotation_line(db, quote.id, ws.id, quantity=2.0, unit_price=100.0, discount_pct=0.0, line_total=200.0, position=0)
    await make_quotation_line(db, quote.id, ws.id, quantity=1.0, unit_price=300.0, discount_pct=0.0, line_total=300.0, position=1)

    await _recalculate(db, quote)

    assert quote.subtotal == pytest.approx(500.0)
    assert quote.total == pytest.approx(500.0)


async def test_recalculate_quote_level_discount(db: AsyncSession):
    ws = await make_workspace(db)
    deal = await make_deal(db, ws.id)
    quote = await make_quotation(db, deal.id, ws.id, discount_pct=10.0, tax_pct=0.0)
    await make_quotation_line(db, quote.id, ws.id, quantity=1.0, unit_price=1000.0, discount_pct=0.0, line_total=1000.0)

    await _recalculate(db, quote)

    assert quote.subtotal == pytest.approx(1000.0)
    assert quote.discount_amount == pytest.approx(100.0)
    assert quote.total == pytest.approx(900.0)


async def test_recalculate_tax_applied_after_discount(db: AsyncSession):
    ws = await make_workspace(db)
    deal = await make_deal(db, ws.id)
    # 10% discount on 1000 = 900 after discount, then 10% tax on 900 = 90
    quote = await make_quotation(db, deal.id, ws.id, discount_pct=10.0, tax_pct=10.0)
    await make_quotation_line(db, quote.id, ws.id, quantity=1.0, unit_price=1000.0, discount_pct=0.0, line_total=1000.0)

    await _recalculate(db, quote)

    assert quote.subtotal == pytest.approx(1000.0)
    assert quote.discount_amount == pytest.approx(100.0)
    assert quote.tax_amount == pytest.approx(90.0)
    assert quote.total == pytest.approx(990.0)


async def test_recalculate_total_formula(db: AsyncSession):
    """total = subtotal - discount_amount + tax_amount"""
    ws = await make_workspace(db)
    deal = await make_deal(db, ws.id)
    quote = await make_quotation(db, deal.id, ws.id, discount_pct=20.0, tax_pct=5.0)
    await make_quotation_line(db, quote.id, ws.id, quantity=1.0, unit_price=500.0, discount_pct=0.0, line_total=500.0)

    await _recalculate(db, quote)

    expected_subtotal = 500.0
    expected_disc = 500.0 * 0.20  # 100
    after_disc = expected_subtotal - expected_disc  # 400
    expected_tax = after_disc * 0.05  # 20
    expected_total = after_disc + expected_tax  # 420

    assert quote.subtotal == pytest.approx(expected_subtotal)
    assert quote.discount_amount == pytest.approx(expected_disc)
    assert quote.tax_amount == pytest.approx(expected_tax)
    assert quote.total == pytest.approx(expected_total)


async def test_recalculate_zero_discount_zero_tax(db: AsyncSession):
    ws = await make_workspace(db)
    deal = await make_deal(db, ws.id)
    quote = await make_quotation(db, deal.id, ws.id, discount_pct=0.0, tax_pct=0.0)
    await make_quotation_line(db, quote.id, ws.id, quantity=5.0, unit_price=20.0, discount_pct=0.0, line_total=100.0)

    await _recalculate(db, quote)

    assert quote.subtotal == pytest.approx(100.0)
    assert quote.discount_amount == pytest.approx(0.0)
    assert quote.tax_amount == pytest.approx(0.0)
    assert quote.total == pytest.approx(100.0)


async def test_recalculate_line_discount_reflected_in_subtotal(db: AsyncSession):
    """Line-level discount is baked into line_total; subtotal sums line_totals."""
    ws = await make_workspace(db)
    deal = await make_deal(db, ws.id)
    quote = await make_quotation(db, deal.id, ws.id, discount_pct=0.0, tax_pct=0.0)
    # Line with 50% discount: 2 * 100 * 0.5 = 100
    line_total = _calc_line_total(2.0, 100.0, 50.0)
    await make_quotation_line(db, quote.id, ws.id, quantity=2.0, unit_price=100.0, discount_pct=50.0, line_total=line_total)

    await _recalculate(db, quote)

    assert quote.subtotal == pytest.approx(100.0)
    assert quote.total == pytest.approx(100.0)


async def test_recalculate_no_lines_zero_totals(db: AsyncSession):
    ws = await make_workspace(db)
    deal = await make_deal(db, ws.id)
    quote = await make_quotation(db, deal.id, ws.id, discount_pct=10.0, tax_pct=8.0)

    await _recalculate(db, quote)

    assert quote.subtotal == pytest.approx(0.0)
    assert quote.discount_amount == pytest.approx(0.0)
    assert quote.tax_amount == pytest.approx(0.0)
    assert quote.total == pytest.approx(0.0)
