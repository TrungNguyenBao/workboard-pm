import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.hrm.schemas.onboarding_checklist import (
    OnboardingChecklistCreate,
    OnboardingChecklistResponse,
    OnboardingChecklistUpdate,
)
from app.modules.hrm.services.onboarding_checklist import (
    create_onboarding_checklist,
    delete_onboarding_checklist,
    generate_default_checklist,
    get_onboarding_checklist,
    list_onboarding_checklists,
    toggle_completion,
    update_onboarding_checklist,
)
from app.schemas.pagination import PaginatedResponse

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/onboarding-checklists",
    response_model=OnboardingChecklistResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: OnboardingChecklistCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_onboarding_checklist(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/onboarding-checklists",
    response_model=PaginatedResponse[OnboardingChecklistResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_onboarding_checklists(db, workspace_id, employee_id, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/onboarding-checklists/{item_id}",
    response_model=OnboardingChecklistResponse,
)
async def get_one(
    workspace_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_onboarding_checklist(db, item_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/onboarding-checklists/{item_id}",
    response_model=OnboardingChecklistResponse,
)
async def update(
    workspace_id: uuid.UUID,
    item_id: uuid.UUID,
    data: OnboardingChecklistUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_onboarding_checklist(db, item_id, workspace_id, data)


@router.patch(
    "/workspaces/{workspace_id}/onboarding-checklists/{item_id}/complete",
    response_model=OnboardingChecklistResponse,
)
async def complete(
    workspace_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await toggle_completion(db, item_id, workspace_id)


@router.post(
    "/workspaces/{workspace_id}/onboarding-checklists/generate/{employee_id}",
    response_model=list[OnboardingChecklistResponse],
    status_code=status.HTTP_201_CREATED,
)
async def generate(
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await generate_default_checklist(db, workspace_id, employee_id)


@router.delete(
    "/workspaces/{workspace_id}/onboarding-checklists/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    await delete_onboarding_checklist(db, item_id, workspace_id)
