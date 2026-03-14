import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.ticket import Ticket
from app.modules.crm.schemas.ticket import TicketCreate, TicketUpdate


async def get_ticket_stats(db: AsyncSession, workspace_id: uuid.UUID) -> dict:
    """Compute ticket KPIs: avg resolution time, resolution rate, counts by priority."""
    all_tickets = list((await db.scalars(
        select(Ticket).where(Ticket.workspace_id == workspace_id)
    )).all())

    total = len(all_tickets)
    resolved = [t for t in all_tickets if t.resolved_at and t.created_at]
    open_count = sum(1 for t in all_tickets if t.status in ("open", "in_progress"))

    avg_resolution_hours: float = 0.0
    if resolved:
        total_seconds = sum((t.resolved_at - t.created_at).total_seconds() for t in resolved)
        avg_resolution_hours = round(total_seconds / len(resolved) / 3600, 1)

    resolution_rate = round(len(resolved) / total * 100, 1) if total > 0 else 0.0

    by_priority: dict[str, int] = {}
    for t in all_tickets:
        by_priority[t.priority] = by_priority.get(t.priority, 0) + 1

    return {
        "total": total,
        "open_count": open_count,
        "resolved_count": len(resolved),
        "avg_resolution_hours": avg_resolution_hours,
        "resolution_rate": resolution_rate,
        "by_priority": by_priority,
    }


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
        from app.modules.crm.services.status_flows import escape_like

        pattern = f"%{escape_like(search)}%"
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
        now = datetime.now(timezone.utc)
        new_status = updates["status"]
        if new_status == "open" and ticket.status in ("resolved", "closed"):
            ticket.reopen_count += 1
        elif new_status == "resolved":
            ticket.resolved_at = now
        elif new_status == "closed":
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
