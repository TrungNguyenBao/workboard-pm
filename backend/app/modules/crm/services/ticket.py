import uuid
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.ticket import Ticket
from app.modules.crm.schemas.ticket import TicketCreate, TicketUpdate


async def create_ticket(db: AsyncSession, workspace_id: uuid.UUID, data: TicketCreate) -> Ticket:
    ticket = Ticket(workspace_id=workspace_id, **data.model_dump())
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return ticket


async def list_tickets(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    status_filter: str | None = None,
    priority: str | None = None,
    contact_id: uuid.UUID | None = None,
    account_id: uuid.UUID | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Ticket], int]:
    q = select(Ticket).where(Ticket.workspace_id == workspace_id)
    count_q = select(func.count(Ticket.id)).where(Ticket.workspace_id == workspace_id)

    if status_filter:
        q = q.where(Ticket.status == status_filter)
        count_q = count_q.where(Ticket.status == status_filter)
    if priority:
        q = q.where(Ticket.priority == priority)
        count_q = count_q.where(Ticket.priority == priority)
    if contact_id:
        q = q.where(Ticket.contact_id == contact_id)
        count_q = count_q.where(Ticket.contact_id == contact_id)
    if account_id:
        q = q.where(Ticket.account_id == account_id)
        count_q = count_q.where(Ticket.account_id == account_id)
    if search:
        pattern = f"%{search}%"
        q = q.where(Ticket.subject.ilike(pattern))
        count_q = count_q.where(Ticket.subject.ilike(pattern))

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Ticket.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_ticket(db: AsyncSession, ticket_id: uuid.UUID, workspace_id: uuid.UUID) -> Ticket:
    result = await db.scalars(
        select(Ticket).where(Ticket.id == ticket_id, Ticket.workspace_id == workspace_id)
    )
    ticket = result.first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return ticket


async def update_ticket(
    db: AsyncSession, ticket_id: uuid.UUID, workspace_id: uuid.UUID, data: TicketUpdate
) -> Ticket:
    from app.modules.crm.services.status_flows import TICKET_STATUS_TRANSITIONS, validate_transition

    ticket = await get_ticket(db, ticket_id, workspace_id)
    updates = data.model_dump(exclude_none=True)

    if "status" in updates and updates["status"] != ticket.status:
        if not validate_transition(TICKET_STATUS_TRANSITIONS, ticket.status, updates["status"]):
            allowed = TICKET_STATUS_TRANSITIONS.get(ticket.status, [])
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition from '{ticket.status}' to '{updates['status']}'. Allowed: {allowed}",
            )
        now = datetime.utcnow()
        if updates["status"] == "resolved":
            ticket.resolved_at = now
        elif updates["status"] == "closed":
            ticket.closed_at = now

    for field, value in updates.items():
        setattr(ticket, field, value)
    await db.commit()
    await db.refresh(ticket)
    return ticket


async def delete_ticket(db: AsyncSession, ticket_id: uuid.UUID, workspace_id: uuid.UUID) -> None:
    ticket = await get_ticket(db, ticket_id, workspace_id)
    await db.delete(ticket)
    await db.commit()
