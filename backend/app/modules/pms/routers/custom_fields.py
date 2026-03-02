import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.modules.pms.dependencies.rbac import require_project_role
from app.modules.pms.schemas.custom_field import (
    CustomFieldCreate,
    CustomFieldResponse,
    CustomFieldUpdate,
)
from app.modules.pms.services.custom_field import (
    create_field,
    delete_field,
    list_fields,
    update_field,
)

router = APIRouter(prefix="/projects/{project_id}/custom-fields", tags=["custom-fields"])


@router.post("", response_model=CustomFieldResponse, status_code=status.HTTP_201_CREATED)
async def create(
    project_id: uuid.UUID,
    data: CustomFieldCreate,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    return await create_field(db, project_id, data, current_user)


@router.get("", response_model=list[CustomFieldResponse])
async def list_(
    project_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await list_fields(db, project_id)


@router.patch("/{field_id}", response_model=CustomFieldResponse)
async def update(
    project_id: uuid.UUID,
    field_id: uuid.UUID,
    data: CustomFieldUpdate,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    return await update_field(db, field_id, data, project_id)


@router.delete("/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    project_id: uuid.UUID,
    field_id: uuid.UUID,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    await delete_field(db, field_id, project_id)
