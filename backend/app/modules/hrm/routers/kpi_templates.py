import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.schemas.pagination import PaginatedResponse
from app.modules.hrm.schemas.kpi_template import KpiTemplateCreate, KpiTemplateResponse, KpiTemplateUpdate
from app.modules.hrm.services.kpi_template import (
    create_kpi_template,
    delete_kpi_template,
    get_kpi_template,
    list_kpi_templates,
    update_kpi_template,
)

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/kpi-templates",
    response_model=KpiTemplateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: KpiTemplateCreate,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await create_kpi_template(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/kpi-templates",
    response_model=PaginatedResponse[KpiTemplateResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_kpi_templates(db, workspace_id, search, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/kpi-templates/{template_id}",
    response_model=KpiTemplateResponse,
)
async def get_one(
    workspace_id: uuid.UUID,
    template_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_kpi_template(db, template_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/kpi-templates/{template_id}",
    response_model=KpiTemplateResponse,
)
async def update(
    workspace_id: uuid.UUID,
    template_id: uuid.UUID,
    data: KpiTemplateUpdate,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await update_kpi_template(db, template_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/kpi-templates/{template_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    template_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_kpi_template(db, template_id, workspace_id)
