import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.schemas.pagination import PaginatedResponse
from app.modules.hrm.schemas.training_enrollment import (
    TrainingEnrollmentCreate,
    TrainingEnrollmentResponse,
    TrainingEnrollmentUpdate,
)
from app.modules.hrm.services.training_enrollment import (
    complete_enrollment,
    create_training_enrollment,
    delete_training_enrollment,
    get_training_enrollment,
    list_training_enrollments,
    update_training_enrollment,
)

router = APIRouter(tags=["hrm"])


class CompleteEnrollmentRequest(BaseModel):
    score: Decimal | None = None
    feedback: str | None = None


@router.post(
    "/workspaces/{workspace_id}/training-enrollments",
    response_model=TrainingEnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: TrainingEnrollmentCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_training_enrollment(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/training-enrollments",
    response_model=PaginatedResponse[TrainingEnrollmentResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    program_id: uuid.UUID | None = Query(default=None),
    employee_id: uuid.UUID | None = Query(default=None),
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_training_enrollments(
        db, workspace_id, program_id, employee_id, status, page, page_size
    )
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/training-enrollments/{enrollment_id}",
    response_model=TrainingEnrollmentResponse,
)
async def get_one(
    workspace_id: uuid.UUID,
    enrollment_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_training_enrollment(db, enrollment_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/training-enrollments/{enrollment_id}",
    response_model=TrainingEnrollmentResponse,
)
async def update(
    workspace_id: uuid.UUID,
    enrollment_id: uuid.UUID,
    data: TrainingEnrollmentUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_training_enrollment(db, enrollment_id, workspace_id, data)


@router.post(
    "/workspaces/{workspace_id}/training-enrollments/{enrollment_id}/complete",
    response_model=TrainingEnrollmentResponse,
)
async def complete(
    workspace_id: uuid.UUID,
    enrollment_id: uuid.UUID,
    data: CompleteEnrollmentRequest,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await complete_enrollment(db, enrollment_id, workspace_id, data.score, data.feedback)


@router.delete(
    "/workspaces/{workspace_id}/training-enrollments/{enrollment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    enrollment_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    await delete_training_enrollment(db, enrollment_id, workspace_id)
