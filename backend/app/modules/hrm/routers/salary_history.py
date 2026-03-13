import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.hrm.schemas.salary_history import SalaryHistoryCreate, SalaryHistoryResponse
from app.modules.hrm.services.salary_history import create_salary_history, list_salary_history
from app.schemas.pagination import PaginatedResponse

router = APIRouter(tags=["hrm"])


@router.get(
    "/workspaces/{workspace_id}/salary-history",
    response_model=PaginatedResponse[SalaryHistoryResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID = Query(...),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_salary_history(db, workspace_id, employee_id, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.post(
    "/workspaces/{workspace_id}/salary-history",
    response_model=SalaryHistoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: SalaryHistoryCreate,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await create_salary_history(db, workspace_id, data)
