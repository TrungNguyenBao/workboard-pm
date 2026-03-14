import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.contract import ContractCreate, ContractResponse, ContractUpdate
from app.modules.crm.schemas.pagination import PaginatedResponse
from app.modules.crm.services.contract import (
    activate_contract,
    create_contract,
    delete_contract,
    get_contract,
    list_contracts,
    renew_contract,
    terminate_contract,
    update_contract,
)

router = APIRouter(tags=["crm"])


class ActivateRequest(BaseModel):
    signed_date: date | None = None


@router.post(
    "/workspaces/{workspace_id}/contracts",
    response_model=ContractResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: ContractCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_contract(db, workspace_id, data, created_by=current_user.id)


@router.get("/workspaces/{workspace_id}/contracts", response_model=PaginatedResponse[ContractResponse])
async def list_(
    workspace_id: uuid.UUID,
    account_id: uuid.UUID | None = Query(default=None),
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_contracts(db, workspace_id, account_id, status, search, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/workspaces/{workspace_id}/contracts/{contract_id}", response_model=ContractResponse)
async def get(
    workspace_id: uuid.UUID,
    contract_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_contract(db, contract_id, workspace_id)


@router.patch("/workspaces/{workspace_id}/contracts/{contract_id}", response_model=ContractResponse)
async def update(
    workspace_id: uuid.UUID,
    contract_id: uuid.UUID,
    data: ContractUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_contract(db, contract_id, workspace_id, data)


@router.delete("/workspaces/{workspace_id}/contracts/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    workspace_id: uuid.UUID,
    contract_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_contract(db, contract_id, workspace_id)


@router.post("/workspaces/{workspace_id}/contracts/{contract_id}/activate", response_model=ContractResponse)
async def activate(
    workspace_id: uuid.UUID,
    contract_id: uuid.UUID,
    body: ActivateRequest = ActivateRequest(),
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await activate_contract(db, contract_id, workspace_id, signed_date=body.signed_date)


@router.post("/workspaces/{workspace_id}/contracts/{contract_id}/renew", response_model=ContractResponse)
async def renew(
    workspace_id: uuid.UUID,
    contract_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await renew_contract(db, contract_id, workspace_id, user_id=current_user.id)


@router.post("/workspaces/{workspace_id}/contracts/{contract_id}/terminate", response_model=ContractResponse)
async def terminate(
    workspace_id: uuid.UUID,
    contract_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await terminate_contract(db, contract_id, workspace_id)
