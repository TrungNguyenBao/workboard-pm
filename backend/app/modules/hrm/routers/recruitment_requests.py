import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.schemas.pagination import PaginatedResponse
from app.modules.hrm.schemas.recruitment_request import (
    RecruitmentRequestCreate,
    RecruitmentRequestResponse,
    RecruitmentRequestUpdate,
)
from app.modules.hrm.services.recruitment_request import (
    create_recruitment_request,
    delete_recruitment_request,
    get_recruitment_request,
    list_recruitment_requests,
    update_recruitment_request,
)

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/recruitment-requests",
    response_model=RecruitmentRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: RecruitmentRequestCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_recruitment_request(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/recruitment-requests",
    response_model=PaginatedResponse[RecruitmentRequestResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    department_id: uuid.UUID | None = Query(default=None),
    req_status: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_recruitment_requests(db, workspace_id, department_id, req_status, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/recruitment-requests/{request_id}",
    response_model=RecruitmentRequestResponse,
)
async def get_one(
    workspace_id: uuid.UUID,
    request_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_recruitment_request(db, request_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/recruitment-requests/{request_id}",
    response_model=RecruitmentRequestResponse,
)
async def update(
    workspace_id: uuid.UUID,
    request_id: uuid.UUID,
    data: RecruitmentRequestUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_recruitment_request(db, request_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/recruitment-requests/{request_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    request_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_recruitment_request(db, request_id, workspace_id)
