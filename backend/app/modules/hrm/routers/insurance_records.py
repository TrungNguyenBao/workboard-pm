import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.hrm.schemas.insurance_record import (
    InsuranceRecordCreate,
    InsuranceRecordResponse,
    InsuranceRecordUpdate,
)
from app.modules.hrm.services.insurance_record import (
    create_insurance,
    delete_insurance,
    get_insurance,
    list_insurance,
    update_insurance,
)

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/insurance-records",
    response_model=InsuranceRecordResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: InsuranceRecordCreate,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await create_insurance(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/insurance-records",
    response_model=list[InsuranceRecordResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = Query(default=None),
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await list_insurance(db, workspace_id, employee_id)


@router.get(
    "/workspaces/{workspace_id}/insurance-records/{record_id}",
    response_model=InsuranceRecordResponse,
)
async def get(
    workspace_id: uuid.UUID,
    record_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await get_insurance(db, record_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/insurance-records/{record_id}",
    response_model=InsuranceRecordResponse,
)
async def update(
    workspace_id: uuid.UUID,
    record_id: uuid.UUID,
    data: InsuranceRecordUpdate,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await update_insurance(db, record_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/insurance-records/{record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    record_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_insurance(db, record_id, workspace_id)
