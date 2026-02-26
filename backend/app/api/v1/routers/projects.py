import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.rbac import require_project_role, require_workspace_role
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services.project import (
    create_project,
    delete_project,
    get_project,
    list_projects,
    update_project,
)

router = APIRouter(tags=["projects"])


@router.post(
    "/workspaces/{workspace_id}/projects",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: ProjectCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_project(db, workspace_id, data, current_user)


@router.get("/workspaces/{workspace_id}/projects", response_model=list[ProjectResponse])
async def list_(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await list_projects(db, workspace_id, current_user.id)


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get(
    project_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await get_project(db, project_id)


@router.patch("/projects/{project_id}", response_model=ProjectResponse)
async def update(
    project_id: uuid.UUID,
    data: ProjectUpdate,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    return await update_project(db, project_id, data)


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    project_id: uuid.UUID,
    current_user: User = Depends(require_project_role("owner")),
    db: AsyncSession = Depends(get_db),
):
    await delete_project(db, project_id)
