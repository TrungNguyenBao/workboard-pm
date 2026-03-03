import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.contact import ContactCreate, ContactResponse, ContactUpdate
from app.modules.crm.schemas.pagination import PaginatedResponse
from app.modules.crm.services.contact import (
    create_contact,
    delete_contact,
    get_contact,
    list_contacts,
    update_contact,
)

router = APIRouter(tags=["crm"])


@router.post(
    "/workspaces/{workspace_id}/contacts",
    response_model=ContactResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: ContactCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_contact(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/contacts",
    response_model=PaginatedResponse[ContactResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_contacts(db, workspace_id, search, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/contacts/{contact_id}",
    response_model=ContactResponse,
)
async def get(
    workspace_id: uuid.UUID,
    contact_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_contact(db, contact_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/contacts/{contact_id}",
    response_model=ContactResponse,
)
async def update(
    workspace_id: uuid.UUID,
    contact_id: uuid.UUID,
    data: ContactUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_contact(db, contact_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/contacts/{contact_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    contact_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_contact(db, contact_id, workspace_id)
