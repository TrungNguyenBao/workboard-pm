import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.hrm.dependencies.rbac import require_hrm_role
from app.modules.hrm.schemas.training_program import (
    TrainingProgramCreate,
    TrainingProgramResponse,
    TrainingProgramUpdate,
)
from app.modules.hrm.services.training_program import (
    approve_training,
    complete_training,
    create_training_program,
    delete_training_program,
    get_training_program,
    list_training_programs,
    start_training,
    update_training_program,
)
from app.schemas.pagination import PaginatedResponse

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/training-programs",
    response_model=TrainingProgramResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: TrainingProgramCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_training_program(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/training-programs",
    response_model=PaginatedResponse[TrainingProgramResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_training_programs(db, workspace_id, status, search, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/training-programs/{program_id}",
    response_model=TrainingProgramResponse,
)
async def get_one(
    workspace_id: uuid.UUID,
    program_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_training_program(db, program_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/training-programs/{program_id}",
    response_model=TrainingProgramResponse,
)
async def update(
    workspace_id: uuid.UUID,
    program_id: uuid.UUID,
    data: TrainingProgramUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_training_program(db, program_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/training-programs/{program_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    program_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_training_program(db, program_id, workspace_id)


@router.post(
    "/workspaces/{workspace_id}/training-programs/{program_id}/approve",
    response_model=TrainingProgramResponse,
)
async def approve(
    workspace_id: uuid.UUID,
    program_id: uuid.UUID,
    current_user: User = Depends(require_hrm_role("hr_manager")),
    db: AsyncSession = Depends(get_db),
):
    return await approve_training(db, program_id, workspace_id, current_user.id)


@router.post(
    "/workspaces/{workspace_id}/training-programs/{program_id}/start",
    response_model=TrainingProgramResponse,
)
async def start(
    workspace_id: uuid.UUID,
    program_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await start_training(db, program_id, workspace_id)


@router.post(
    "/workspaces/{workspace_id}/training-programs/{program_id}/complete",
    response_model=TrainingProgramResponse,
)
async def complete(
    workspace_id: uuid.UUID,
    program_id: uuid.UUID,
    current_user: User = Depends(require_hrm_role("hr_manager")),
    db: AsyncSession = Depends(get_db),
):
    return await complete_training(db, program_id, workspace_id)
