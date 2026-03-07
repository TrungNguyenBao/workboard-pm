import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.deal import DealResponse
from app.modules.crm.schemas.lead import LeadCreate, LeadResponse, LeadUpdate
from app.modules.crm.schemas.pagination import PaginatedResponse
from app.modules.crm.services.lead import (
    convert_lead_to_opportunity,
    create_lead,
    delete_lead,
    get_lead,
    list_leads,
    update_lead,
)

router = APIRouter(tags=["crm"])


@router.post(
    "/workspaces/{workspace_id}/leads",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: LeadCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    from fastapi.responses import JSONResponse

    lead, warning = await create_lead(db, workspace_id, data)
    response = JSONResponse(
        content=LeadResponse.model_validate(lead).model_dump(mode="json"),
        status_code=status.HTTP_201_CREATED,
    )
    if warning:
        response.headers["X-Duplicate-Warning"] = warning
    return response


@router.get(
    "/workspaces/{workspace_id}/leads",
    response_model=PaginatedResponse[LeadResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    status_filter: str | None = Query(default=None, alias="status"),
    source: str | None = Query(default=None),
    owner_id: uuid.UUID | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_leads(db, workspace_id, status_filter, source, owner_id, search, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/leads/{lead_id}",
    response_model=LeadResponse,
)
async def get(
    workspace_id: uuid.UUID,
    lead_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_lead(db, lead_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/leads/{lead_id}",
    response_model=LeadResponse,
)
async def update(
    workspace_id: uuid.UUID,
    lead_id: uuid.UUID,
    data: LeadUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_lead(db, lead_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/leads/{lead_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    lead_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_lead(db, lead_id, workspace_id)


@router.post(
    "/workspaces/{workspace_id}/leads/{lead_id}/convert",
    response_model=DealResponse,
    status_code=status.HTTP_201_CREATED,
)
async def convert(
    workspace_id: uuid.UUID,
    lead_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await convert_lead_to_opportunity(db, lead_id, workspace_id)
