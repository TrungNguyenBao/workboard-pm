import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.models.workspace import WorkspaceMembership
from app.modules.hrm.dependencies.rbac import require_hrm_role
from app.modules.hrm.schemas.purchase_request import (
    PurchaseRequestCreate,
    PurchaseRequestResponse,
    PurchaseRequestUpdate,
)
from app.modules.hrm.services.purchase_request import (
    approve_request,
    create_purchase_request,
    delete_purchase_request,
    get_purchase_request,
    list_purchase_requests,
    reject_request,
    submit_request,
    update_purchase_request,
)
from app.schemas.pagination import PaginatedResponse

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/purchase-requests",
    response_model=PurchaseRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: PurchaseRequestCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_purchase_request(db, workspace_id, current_user.id, data)


@router.get(
    "/workspaces/{workspace_id}/purchase-requests",
    response_model=PaginatedResponse[PurchaseRequestResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    pr_status: str | None = Query(default=None, alias="status"),
    requester_id: uuid.UUID | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_purchase_requests(db, workspace_id, pr_status, requester_id, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/purchase-requests/{pr_id}",
    response_model=PurchaseRequestResponse,
)
async def get(
    workspace_id: uuid.UUID,
    pr_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_purchase_request(db, pr_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/purchase-requests/{pr_id}",
    response_model=PurchaseRequestResponse,
)
async def update(
    workspace_id: uuid.UUID,
    pr_id: uuid.UUID,
    data: PurchaseRequestUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_purchase_request(db, pr_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/purchase-requests/{pr_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    pr_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_purchase_request(db, pr_id, workspace_id)


@router.post(
    "/workspaces/{workspace_id}/purchase-requests/{pr_id}/submit",
    response_model=PurchaseRequestResponse,
)
async def submit(
    workspace_id: uuid.UUID,
    pr_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await submit_request(db, pr_id, workspace_id)


@router.post(
    "/workspaces/{workspace_id}/purchase-requests/{pr_id}/approve",
    response_model=PurchaseRequestResponse,
)
async def approve(
    workspace_id: uuid.UUID,
    pr_id: uuid.UUID,
    current_user: User = Depends(require_hrm_role("line_manager")),
    db: AsyncSession = Depends(get_db),
):
    membership = await db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == workspace_id,
            WorkspaceMembership.user_id == current_user.id,
        )
    )
    approver_hrm_role = membership.hrm_role if membership else None
    return await approve_request(db, pr_id, workspace_id, current_user.id, approver_hrm_role)


@router.post(
    "/workspaces/{workspace_id}/purchase-requests/{pr_id}/reject",
    response_model=PurchaseRequestResponse,
)
async def reject(
    workspace_id: uuid.UUID,
    pr_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await reject_request(db, pr_id, workspace_id)
