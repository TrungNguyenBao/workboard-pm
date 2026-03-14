import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.deal_contact_role import (
    DealContactRoleCreate,
    DealContactRoleResponse,
    DealContactRoleUpdate,
)
from app.modules.crm.services.deal_contact_role import (
    add_contact_to_deal,
    list_deal_contacts,
    remove_contact_from_deal,
    update_role,
)

router = APIRouter(tags=["crm"])


@router.post(
    "/workspaces/{workspace_id}/deals/{deal_id}/contacts",
    response_model=DealContactRoleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_contact(
    workspace_id: uuid.UUID,
    deal_id: uuid.UUID,
    data: DealContactRoleCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await add_contact_to_deal(db, deal_id, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/deals/{deal_id}/contacts",
    response_model=list[DealContactRoleResponse],
)
async def list_contacts(
    workspace_id: uuid.UUID,
    deal_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await list_deal_contacts(db, deal_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/deals/{deal_id}/contacts/{role_id}",
    response_model=DealContactRoleResponse,
)
async def update_contact_role(
    workspace_id: uuid.UUID,
    deal_id: uuid.UUID,
    role_id: uuid.UUID,
    data: DealContactRoleUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_role(db, role_id, deal_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/deals/{deal_id}/contacts/{role_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_contact(
    workspace_id: uuid.UUID,
    deal_id: uuid.UUID,
    role_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    await remove_contact_from_deal(db, role_id, deal_id, workspace_id)
