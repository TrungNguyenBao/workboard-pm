import logging
import uuid

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.schemas.pagination import PaginatedResponse
from app.modules.hrm.models.candidate import Candidate
from app.modules.hrm.schemas.offer import (
    OfferCreate,
    OfferResponse,
    OfferUpdate,
)
from app.modules.hrm.dependencies.rbac import require_hrm_role
from app.modules.hrm.services.email_notifications import offer_sent_email
from app.modules.hrm.services.offer import (
    accept_offer,
    approve_offer_hr,
    create_offer,
    delete_offer,
    get_offer,
    list_offers,
    reject_offer,
    send_offer,
    update_offer,
)

log = logging.getLogger(__name__)

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/offers",
    response_model=OfferResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: OfferCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_offer(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/offers",
    response_model=PaginatedResponse[OfferResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    candidate_id: uuid.UUID | None = Query(default=None),
    offer_status: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_offers(db, workspace_id, candidate_id, offer_status, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/offers/{offer_id}",
    response_model=OfferResponse,
)
async def get_one(
    workspace_id: uuid.UUID,
    offer_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_offer(db, offer_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/offers/{offer_id}",
    response_model=OfferResponse,
)
async def update(
    workspace_id: uuid.UUID,
    offer_id: uuid.UUID,
    data: OfferUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_offer(db, offer_id, workspace_id, data)


@router.post("/workspaces/{workspace_id}/offers/{offer_id}/approve-hr", response_model=OfferResponse)
async def approve_hr(
    workspace_id: uuid.UUID,
    offer_id: uuid.UUID,
    current_user: User = Depends(require_hrm_role("hr_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await approve_offer_hr(db, offer_id, workspace_id, current_user.id)


@router.post("/workspaces/{workspace_id}/offers/{offer_id}/send", response_model=OfferResponse)
async def send(
    request: Request,
    workspace_id: uuid.UUID,
    offer_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    o = await send_offer(db, offer_id, workspace_id)
    try:
        arq_pool = getattr(request.app.state, "arq_pool", None)
        if arq_pool:
            candidate = await db.scalar(select(Candidate).where(Candidate.id == o.candidate_id))
            if candidate:
                body = offer_sent_email(candidate.name, o.position_title)
                await arq_pool.enqueue_job("send_hrm_notification", to_email=candidate.email, subject="Job Offer", body=body)
    except Exception:
        log.exception("Failed to enqueue offer-sent email for offer_id=%s", offer_id)
    return o


@router.post("/workspaces/{workspace_id}/offers/{offer_id}/accept", response_model=OfferResponse)
async def accept(
    workspace_id: uuid.UUID,
    offer_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await accept_offer(db, offer_id, workspace_id)


@router.post("/workspaces/{workspace_id}/offers/{offer_id}/reject", response_model=OfferResponse)
async def reject(
    workspace_id: uuid.UUID,
    offer_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await reject_offer(db, offer_id, workspace_id)


@router.delete(
    "/workspaces/{workspace_id}/offers/{offer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    offer_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_offer(db, offer_id, workspace_id)
