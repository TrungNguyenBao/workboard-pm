import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.email_template import (
    EmailTemplateCreate,
    EmailTemplateResponse,
    EmailTemplateUpdate,
)
from app.modules.crm.schemas.pagination import PaginatedResponse
from app.modules.crm.services.email_template import (
    create_email_template,
    delete_email_template,
    get_email_template,
    list_email_templates,
    update_email_template,
)

router = APIRouter(tags=["crm"])


@router.post(
    "/workspaces/{workspace_id}/email-templates",
    response_model=EmailTemplateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: EmailTemplateCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_email_template(db, workspace_id, data, created_by=current_user.id)


@router.get(
    "/workspaces/{workspace_id}/email-templates",
    response_model=PaginatedResponse[EmailTemplateResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    category: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_email_templates(db, workspace_id, category, is_active, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/email-templates/{template_id}",
    response_model=EmailTemplateResponse,
)
async def get(
    workspace_id: uuid.UUID,
    template_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_email_template(db, template_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/email-templates/{template_id}",
    response_model=EmailTemplateResponse,
)
async def update(
    workspace_id: uuid.UUID,
    template_id: uuid.UUID,
    data: EmailTemplateUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_email_template(db, template_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/email-templates/{template_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    template_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_email_template(db, template_id, workspace_id)
