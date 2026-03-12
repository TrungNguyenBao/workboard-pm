import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.modules.pms.dependencies.rbac import require_project_role
from app.modules.pms.schemas.dependency import DependencyCreate, DependencyResponse
from app.modules.pms.services.dependency import (
    create_dependency,
    delete_dependency,
    list_dependencies,
)

router = APIRouter(
    prefix="/projects/{project_id}/tasks/{task_id}/dependencies",
    tags=["dependencies"],
)


@router.get("", response_model=list[DependencyResponse])
async def list_(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await list_dependencies(db, task_id)


@router.post("", response_model=DependencyResponse, status_code=status.HTTP_201_CREATED)
async def create(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    data: DependencyCreate,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    return await create_dependency(db, task_id, data, current_user)


@router.delete("/{dependency_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    dependency_id: uuid.UUID,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    await delete_dependency(db, dependency_id)
