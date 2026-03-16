"""Quotation CRUD + line management + status actions."""
import uuid
from datetime import date as date_type

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.crm.models.quotation import Quotation
from app.modules.crm.models.quotation_line import QuotationLine
from app.modules.crm.schemas.quotation import (
    QuotationCreate,
    QuotationLineCreate,
    QuotationLineUpdate,
    QuotationUpdate,
)

_NOT_FOUND = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found")
_LINE_NOT_FOUND = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Line not found")


def _calc_line_total(qty: float, price: float, disc: float) -> float:
    return qty * price * (1 - disc / 100)


async def _generate_quote_number(db: AsyncSession, workspace_id: uuid.UUID) -> str:
    count = await db.scalar(select(func.count(Quotation.id)).where(Quotation.workspace_id == workspace_id)) or 0
    return f"QT-{date_type.today().strftime('%Y%m%d')}-{(count + 1):03d}"


async def _get_q(db: AsyncSession, quotation_id: uuid.UUID, workspace_id: uuid.UUID) -> Quotation:
    q = select(Quotation).options(selectinload(Quotation.lines)).where(
        Quotation.id == quotation_id, Quotation.workspace_id == workspace_id
    )
    obj = (await db.scalars(q)).first()
    if not obj:
        raise _NOT_FOUND
    return obj


async def _recalculate(db: AsyncSession, quotation: Quotation) -> None:
    lines = (await db.scalars(select(QuotationLine).where(QuotationLine.quotation_id == quotation.id))).all()
    subtotal = sum(line.line_total for line in lines)
    disc_amt = subtotal * quotation.discount_pct / 100
    after_disc = subtotal - disc_amt
    tax_amt = after_disc * quotation.tax_pct / 100
    quotation.subtotal = subtotal
    quotation.discount_amount = disc_amt
    quotation.tax_amount = tax_amt
    quotation.total = after_disc + tax_amt


async def create_quotation(
    db: AsyncSession, workspace_id: uuid.UUID, data: QuotationCreate, user_id: uuid.UUID | None = None
) -> Quotation:
    quotation = Quotation(
        deal_id=data.deal_id, contact_id=data.contact_id, valid_until=data.valid_until,
        discount_pct=data.discount_pct, tax_pct=data.tax_pct, notes=data.notes,
        quote_number=await _generate_quote_number(db, workspace_id),
        workspace_id=workspace_id, created_by=user_id,
    )
    db.add(quotation)
    await db.flush()
    for i, ld in enumerate(data.lines):
        db.add(QuotationLine(
            quotation_id=quotation.id, workspace_id=workspace_id,
            line_total=_calc_line_total(ld.quantity, ld.unit_price, ld.discount_pct),
            position=i, **ld.model_dump(exclude={"position"}),
        ))
    await db.flush()
    await _recalculate(db, quotation)
    await db.commit()
    return await _get_q(db, quotation.id, workspace_id)


async def list_quotations_by_deal(
    db: AsyncSession, workspace_id: uuid.UUID, deal_id: uuid.UUID
) -> list[Quotation]:
    q = (select(Quotation).options(selectinload(Quotation.lines))
         .where(Quotation.workspace_id == workspace_id, Quotation.deal_id == deal_id)
         .order_by(Quotation.created_at.desc()))
    return list((await db.scalars(q)).all())


async def get_quotation(db: AsyncSession, quotation_id: uuid.UUID, workspace_id: uuid.UUID) -> Quotation:
    return await _get_q(db, quotation_id, workspace_id)


async def update_quotation(
    db: AsyncSession, quotation_id: uuid.UUID, workspace_id: uuid.UUID, data: QuotationUpdate
) -> Quotation:
    quotation = await _get_q(db, quotation_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(quotation, field, value)
    await _recalculate(db, quotation)
    await db.commit()
    return await _get_q(db, quotation_id, workspace_id)


async def add_quotation_line(
    db: AsyncSession, quotation_id: uuid.UUID, workspace_id: uuid.UUID, data: QuotationLineCreate
) -> Quotation:
    quotation = await _get_q(db, quotation_id, workspace_id)
    db.add(QuotationLine(
        quotation_id=quotation_id, workspace_id=workspace_id,
        line_total=_calc_line_total(data.quantity, data.unit_price, data.discount_pct),
        **data.model_dump(),
    ))
    await db.flush()
    await _recalculate(db, quotation)
    await db.commit()
    return await _get_q(db, quotation_id, workspace_id)


async def _get_line(db: AsyncSession, line_id: uuid.UUID, workspace_id: uuid.UUID) -> QuotationLine:
    line = (await db.scalars(
        select(QuotationLine).where(QuotationLine.id == line_id, QuotationLine.workspace_id == workspace_id)
    )).first()
    if not line:
        raise _LINE_NOT_FOUND
    return line


async def update_quotation_line(
    db: AsyncSession, line_id: uuid.UUID, workspace_id: uuid.UUID, data: QuotationLineUpdate
) -> Quotation:
    line = await _get_line(db, line_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(line, field, value)
    line.line_total = _calc_line_total(line.quantity, line.unit_price, line.discount_pct)
    quotation = await _get_q(db, line.quotation_id, workspace_id)
    await _recalculate(db, quotation)
    await db.commit()
    return await _get_q(db, line.quotation_id, workspace_id)


async def delete_quotation_line(db: AsyncSession, line_id: uuid.UUID, workspace_id: uuid.UUID) -> Quotation:
    line = await _get_line(db, line_id, workspace_id)
    quotation_id = line.quotation_id
    await db.delete(line)
    await db.flush()
    quotation = await _get_q(db, quotation_id, workspace_id)
    await _recalculate(db, quotation)
    await db.commit()
    return await _get_q(db, quotation_id, workspace_id)


async def send_quotation(db: AsyncSession, quotation_id: uuid.UUID, workspace_id: uuid.UUID) -> Quotation:
    quotation = await _get_q(db, quotation_id, workspace_id)
    if quotation.status != "draft":
        raise HTTPException(400, "Only draft quotations can be sent")
    quotation.status = "sent"
    await db.commit()
    return await _get_q(db, quotation_id, workspace_id)


async def accept_quotation(db: AsyncSession, quotation_id: uuid.UUID, workspace_id: uuid.UUID) -> Quotation:
    quotation = await _get_q(db, quotation_id, workspace_id)
    if quotation.status not in ("sent", "draft"):
        raise HTTPException(400, "Only sent or draft quotations can be accepted")
    quotation.status = "accepted"
    from app.modules.crm.models.deal import Deal
    deal = await db.get(Deal, quotation.deal_id)
    if deal:
        deal.value = quotation.total
    await db.commit()
    return await _get_q(db, quotation_id, workspace_id)


async def reject_quotation(db: AsyncSession, quotation_id: uuid.UUID, workspace_id: uuid.UUID) -> Quotation:
    quotation = await _get_q(db, quotation_id, workspace_id)
    if quotation.status not in ("sent", "draft"):
        raise HTTPException(400, "Only sent or draft quotations can be rejected")
    quotation.status = "rejected"
    await db.commit()
    return await _get_q(db, quotation_id, workspace_id)
