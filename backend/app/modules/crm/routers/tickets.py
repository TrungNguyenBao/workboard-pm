import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.pagination import PaginatedResponse
from app.modules.crm.schemas.ticket import TicketCreate, TicketResponse, TicketUpdate
from app.modules.crm.services.ticket import (
    create_ticket,
    delete_ticket,
    get_ticket,
    get_ticket_stats,
    list_tickets,
    update_ticket,
)

router = APIRouter(tags=["crm"])


@router.get("/workspaces/{workspace_id}/tickets/stats")
async def get_stats(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    """Ticket KPIs: avg resolution time, resolution rate, counts by priority."""
    return await get_ticket_stats(db, workspace_id)


@router.post(
    "/workspaces/{workspace_id}/tickets",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: TicketCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_ticket(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/tickets",
    response_model=PaginatedResponse[TicketResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    status_filter: str | None = Query(default=None, alias="status"),
    priority: str | None = Query(default=None),
    contact_id: uuid.UUID | None = Query(default=None),
    account_id: uuid.UUID | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_tickets(
        db, workspace_id, status_filter, priority, contact_id, account_id, search, page, page_size
    )
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/tickets/{ticket_id}",
    response_model=TicketResponse,
)
async def get(
    workspace_id: uuid.UUID,
    ticket_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_ticket(db, ticket_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/tickets/{ticket_id}",
    response_model=TicketResponse,
)
async def update(
    workspace_id: uuid.UUID,
    ticket_id: uuid.UUID,
    data: TicketUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_ticket(db, ticket_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/tickets/{ticket_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    ticket_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_ticket(db, ticket_id, workspace_id)
