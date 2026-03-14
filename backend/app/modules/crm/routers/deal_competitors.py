import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.competitor import (
    CompetitorCreate,
    CompetitorResponse,
    CompetitorUpdate,
)
from app.modules.crm.services.competitor import (
    create_competitor,
    delete_competitor,
    list_competitors,
    update_competitor,
)

router = APIRouter(tags=["crm"])


@router.post(
    "/workspaces/{workspace_id}/deals/{deal_id}/competitors",
    response_model=CompetitorResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    deal_id: uuid.UUID,
    data: CompetitorCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_competitor(db, workspace_id, deal_id, data)


@router.get(
    "/workspaces/{workspace_id}/deals/{deal_id}/competitors",
    response_model=list[CompetitorResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    deal_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await list_competitors(db, workspace_id, deal_id)


@router.patch(
    "/workspaces/{workspace_id}/deals/{deal_id}/competitors/{competitor_id}",
    response_model=CompetitorResponse,
)
async def update(
    workspace_id: uuid.UUID,
    deal_id: uuid.UUID,
    competitor_id: uuid.UUID,
    data: CompetitorUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_competitor(db, competitor_id, deal_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/deals/{deal_id}/competitors/{competitor_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    deal_id: uuid.UUID,
    competitor_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    await delete_competitor(db, competitor_id, deal_id, workspace_id)
