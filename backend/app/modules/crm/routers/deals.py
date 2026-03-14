import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.deal import DealCreate, DealResponse, DealUpdate
from app.modules.crm.schemas.pagination import PaginatedResponse
from app.modules.crm.services.deal import (
    create_deal,
    delete_deal,
    get_deal,
    list_deals,
    update_deal,
)

router = APIRouter(tags=["crm"])


@router.post(
    "/workspaces/{workspace_id}/deals",
    response_model=DealResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: DealCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_deal(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/deals",
    response_model=PaginatedResponse[DealResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    contact_id: uuid.UUID | None = Query(default=None),
    stage: str | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_deals(db, workspace_id, contact_id, stage, search, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/deals/{deal_id}",
    response_model=DealResponse,
)
async def get(
    workspace_id: uuid.UUID,
    deal_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_deal(db, deal_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/deals/{deal_id}",
    response_model=DealResponse,
)
async def update(
    workspace_id: uuid.UUID,
    deal_id: uuid.UUID,
    data: DealUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    deal, warning = await update_deal(db, deal_id, workspace_id, data, user_id=current_user.id)
    response = DealResponse.model_validate(deal)
    response.warning = warning
    return response


@router.delete(
    "/workspaces/{workspace_id}/deals/{deal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    deal_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_deal(db, deal_id, workspace_id)
