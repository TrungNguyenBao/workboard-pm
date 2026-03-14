"""Quotation endpoints: CRUD + line management + status actions."""
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.quotation import (
    QuotationCreate,
    QuotationLineCreate,
    QuotationLineUpdate,
    QuotationResponse,
    QuotationUpdate,
)
from app.modules.crm.services.quotation import (
    accept_quotation,
    add_quotation_line,
    create_quotation,
    delete_quotation_line,
    get_quotation,
    list_quotations_by_deal,
    reject_quotation,
    send_quotation,
    update_quotation,
    update_quotation_line,
)

router = APIRouter(tags=["crm"])


@router.post(
    "/workspaces/{workspace_id}/deals/{deal_id}/quotations",
    response_model=QuotationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    deal_id: uuid.UUID,
    data: QuotationCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    data.deal_id = deal_id
    return await create_quotation(db, workspace_id, data, user_id=current_user.id)


@router.get(
    "/workspaces/{workspace_id}/deals/{deal_id}/quotations",
    response_model=list[QuotationResponse],
)
async def list_by_deal(
    workspace_id: uuid.UUID,
    deal_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await list_quotations_by_deal(db, workspace_id, deal_id)


@router.get(
    "/workspaces/{workspace_id}/quotations/{quotation_id}",
    response_model=QuotationResponse,
)
async def get(
    workspace_id: uuid.UUID,
    quotation_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_quotation(db, quotation_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/quotations/{quotation_id}",
    response_model=QuotationResponse,
)
async def update(
    workspace_id: uuid.UUID,
    quotation_id: uuid.UUID,
    data: QuotationUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_quotation(db, quotation_id, workspace_id, data)


@router.post(
    "/workspaces/{workspace_id}/quotations/{quotation_id}/send",
    response_model=QuotationResponse,
)
async def send(
    workspace_id: uuid.UUID,
    quotation_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await send_quotation(db, quotation_id, workspace_id)


@router.post(
    "/workspaces/{workspace_id}/quotations/{quotation_id}/accept",
    response_model=QuotationResponse,
)
async def accept(
    workspace_id: uuid.UUID,
    quotation_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await accept_quotation(db, quotation_id, workspace_id)


@router.post(
    "/workspaces/{workspace_id}/quotations/{quotation_id}/reject",
    response_model=QuotationResponse,
)
async def reject(
    workspace_id: uuid.UUID,
    quotation_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await reject_quotation(db, quotation_id, workspace_id)


@router.post(
    "/workspaces/{workspace_id}/quotations/{quotation_id}/lines",
    response_model=QuotationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_line(
    workspace_id: uuid.UUID,
    quotation_id: uuid.UUID,
    data: QuotationLineCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await add_quotation_line(db, quotation_id, workspace_id, data)


@router.patch(
    "/workspaces/{workspace_id}/quotations/{quotation_id}/lines/{line_id}",
    response_model=QuotationResponse,
)
async def update_line(
    workspace_id: uuid.UUID,
    quotation_id: uuid.UUID,
    line_id: uuid.UUID,
    data: QuotationLineUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_quotation_line(db, line_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/quotations/{quotation_id}/lines/{line_id}",
    response_model=QuotationResponse,
)
async def delete_line(
    workspace_id: uuid.UUID,
    quotation_id: uuid.UUID,
    line_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await delete_quotation_line(db, line_id, workspace_id)
