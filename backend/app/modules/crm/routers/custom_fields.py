import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.crm_custom_field import (
    CrmCustomFieldCreate,
    CrmCustomFieldResponse,
    CrmCustomFieldUpdate,
)
from app.modules.crm.services.crm_custom_field import (
    create_custom_field,
    delete_custom_field,
    list_custom_fields,
    update_custom_field,
)

router = APIRouter(tags=["crm"])


@router.post(
    "/workspaces/{workspace_id}/custom-fields",
    response_model=CrmCustomFieldResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: CrmCustomFieldCreate,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await create_custom_field(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/custom-fields",
    response_model=list[CrmCustomFieldResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    entity_type: str | None = Query(default=None),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await list_custom_fields(db, workspace_id, entity_type)


@router.patch(
    "/workspaces/{workspace_id}/custom-fields/{field_id}",
    response_model=CrmCustomFieldResponse,
)
async def update(
    workspace_id: uuid.UUID,
    field_id: uuid.UUID,
    data: CrmCustomFieldUpdate,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await update_custom_field(db, field_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/custom-fields/{field_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    field_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_custom_field(db, field_id, workspace_id)
