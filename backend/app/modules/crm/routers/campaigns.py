import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.campaign import CampaignCreate, CampaignResponse, CampaignUpdate
from app.modules.crm.schemas.pagination import PaginatedResponse
from app.modules.crm.services.campaign import (
    create_campaign,
    delete_campaign,
    get_campaign,
    list_campaigns,
    update_campaign,
)

router = APIRouter(tags=["crm"])


@router.post(
    "/workspaces/{workspace_id}/campaigns",
    response_model=CampaignResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: CampaignCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_campaign(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/campaigns",
    response_model=PaginatedResponse[CampaignResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    status_filter: str | None = Query(default=None, alias="status"),
    type_filter: str | None = Query(default=None, alias="type"),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_campaigns(db, workspace_id, status_filter, type_filter, search, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/campaigns/{campaign_id}",
    response_model=CampaignResponse,
)
async def get(
    workspace_id: uuid.UUID,
    campaign_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_campaign(db, campaign_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/campaigns/{campaign_id}",
    response_model=CampaignResponse,
)
async def update(
    workspace_id: uuid.UUID,
    campaign_id: uuid.UUID,
    data: CampaignUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_campaign(db, campaign_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/campaigns/{campaign_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    campaign_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_campaign(db, campaign_id, workspace_id)
