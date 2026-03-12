import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.models.workspace import WorkspaceMembership
from app.modules.pms.dependencies.rbac import require_project_role
from app.modules.pms.models.project import Project, ProjectMembership
from app.modules.pms.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectStatsResponse,
    ProjectUpdate,
)
from app.modules.pms.services.project import (
    create_project,
    delete_project,
    get_project,
    get_project_stats,
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
    is_archived: bool | None = False,
    visibility: str | None = None,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await list_projects(db, workspace_id, current_user.id, is_archived, visibility)


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get(
    project_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    project = await get_project(db, project_id)
    response = ProjectResponse.model_validate(project)

    # Resolve current user's effective role for the project
    ws_membership = await db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == project.workspace_id,
            WorkspaceMembership.user_id == current_user.id,
        )
    )
    if ws_membership and ws_membership.role == "admin":
        response.current_user_role = "owner"
    else:
        proj_membership = await db.scalar(
            select(ProjectMembership).where(
                ProjectMembership.project_id == project_id,
                ProjectMembership.user_id == current_user.id,
            )
        )
        response.current_user_role = proj_membership.role if proj_membership else None

    return response


@router.patch("/projects/{project_id}", response_model=ProjectResponse)
async def update(
    project_id: uuid.UUID,
    data: ProjectUpdate,
    current_user: User = Depends(require_project_role("owner")),
    db: AsyncSession = Depends(get_db),
):
    return await update_project(db, project_id, data, current_user)


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    project_id: uuid.UUID,
    current_user: User = Depends(require_project_role("owner")),
    db: AsyncSession = Depends(get_db),
):
    await delete_project(db, project_id)


@router.get("/projects/{project_id}/stats", response_model=ProjectStatsResponse)
async def stats(
    project_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await get_project_stats(db, project_id)
