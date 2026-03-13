import uuid

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.deal import DealResponse
from app.modules.crm.schemas.lead import (
    LeadConvertRequest,
    LeadCreate,
    LeadCreateResponse,
    LeadMergeRequest,
    LeadResponse,
    LeadUpdate,
)
from app.modules.crm.schemas.pagination import PaginatedResponse
from app.modules.crm.services.lead import (
    convert_lead_to_opportunity,
    create_lead,
    delete_lead,
    get_lead,
    list_leads,
    update_lead,
)
from app.modules.crm.services.lead_workflows import merge_leads


class DisqualifyRequest(BaseModel):
    reason: str


router = APIRouter(tags=["crm"])


@router.post(
    "/workspaces/{workspace_id}/leads",
    response_model=LeadCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: LeadCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    lead, duplicates = await create_lead(db, workspace_id, data)
    return LeadCreateResponse(
        lead=LeadResponse.model_validate(lead),
        duplicates=[LeadResponse.model_validate(d) for d in duplicates] if duplicates else None,
    )


@router.post(
    "/workspaces/{workspace_id}/leads/merge",
    response_model=LeadResponse,
    status_code=status.HTTP_200_OK,
)
async def merge(
    workspace_id: uuid.UUID,
    data: LeadMergeRequest,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await merge_leads(db, workspace_id, data.keep_id, data.merge_id)


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
    data: LeadConvertRequest = LeadConvertRequest(),
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await convert_lead_to_opportunity(db, lead_id, workspace_id, data)


@router.post(
    "/workspaces/{workspace_id}/leads/{lead_id}/disqualify",
    response_model=LeadResponse,
)
async def disqualify(
    workspace_id: uuid.UUID,
    lead_id: uuid.UUID,
    data: DisqualifyRequest,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    """Set lead status to disqualified and store the reason."""
    from fastapi import HTTPException

    from app.modules.crm.services.status_flows import LEAD_STATUS_TRANSITIONS, validate_transition

    lead = await get_lead(db, lead_id, workspace_id)
    if not validate_transition(LEAD_STATUS_TRANSITIONS, lead.status, "disqualified"):
        allowed = LEAD_STATUS_TRANSITIONS.get(lead.status, [])
        raise HTTPException(400, f"Cannot disqualify from '{lead.status}'. Allowed: {allowed}")
    lead.status = "disqualified"
    lead.disqualify_reason = data.reason
    await db.commit()
    await db.refresh(lead)
    return lead
