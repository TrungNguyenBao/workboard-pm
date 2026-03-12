import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.pipeline_stage import (
    PipelineStageCreate,
    PipelineStageResponse,
    PipelineStageUpdate,
    ReorderRequest,
)
from app.modules.crm.services.pipeline_stage import (
    create_stage,
    delete_stage,
    list_stages,
    reorder_stages,
    seed_default_stages,
    update_stage,
)

router = APIRouter(tags=["crm"])


@router.get(
    "/workspaces/{workspace_id}/pipeline-stages",
    response_model=list[PipelineStageResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await list_stages(db, workspace_id)


@router.post(
    "/workspaces/{workspace_id}/pipeline-stages",
    response_model=PipelineStageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: PipelineStageCreate,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await create_stage(db, workspace_id, data)


@router.put(
    "/workspaces/{workspace_id}/pipeline-stages/reorder",
    response_model=list[PipelineStageResponse],
)
async def reorder(
    workspace_id: uuid.UUID,
    data: ReorderRequest,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await reorder_stages(db, workspace_id, data.stage_ids)


@router.patch(
    "/workspaces/{workspace_id}/pipeline-stages/{stage_id}",
    response_model=PipelineStageResponse,
)
async def update(
    workspace_id: uuid.UUID,
    stage_id: uuid.UUID,
    data: PipelineStageUpdate,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await update_stage(db, stage_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/pipeline-stages/{stage_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    stage_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_stage(db, stage_id, workspace_id)


@router.post(
    "/workspaces/{workspace_id}/pipeline-stages/seed",
    response_model=list[PipelineStageResponse],
    status_code=status.HTTP_201_CREATED,
)
async def seed(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await seed_default_stages(db, workspace_id)
