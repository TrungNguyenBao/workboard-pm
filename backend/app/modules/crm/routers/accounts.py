import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.account import AccountCreate, AccountResponse, AccountUpdate
from app.modules.crm.schemas.pagination import PaginatedResponse
from app.modules.crm.services.account import (
    create_account,
    delete_account,
    get_account,
    get_account_360,
    list_accounts,
    update_account,
)

router = APIRouter(tags=["crm"])


@router.post(
    "/workspaces/{workspace_id}/accounts",
    response_model=AccountResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: AccountCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_account(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/accounts",
    response_model=PaginatedResponse[AccountResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    status_filter: str | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_accounts(db, workspace_id, status_filter, search, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/accounts/{account_id}",
    response_model=AccountResponse,
)
async def get(
    workspace_id: uuid.UUID,
    account_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_account(db, account_id, workspace_id)


@router.get("/workspaces/{workspace_id}/accounts/{account_id}/360")
async def get_360(
    workspace_id: uuid.UUID,
    account_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_account_360(db, account_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/accounts/{account_id}",
    response_model=AccountResponse,
)
async def update(
    workspace_id: uuid.UUID,
    account_id: uuid.UUID,
    data: AccountUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_account(db, account_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/accounts/{account_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    account_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_account(db, account_id, workspace_id)
