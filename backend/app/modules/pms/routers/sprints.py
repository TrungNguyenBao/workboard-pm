import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.modules.pms.dependencies.rbac import require_project_role
from app.modules.pms.schemas.sprint import (
    BurndownPoint,
    SprintBoardResponse,
    SprintCreate,
    SprintResponse,
    SprintStatusFilter,
    SprintUpdate,
    VelocityPoint,
)
from app.modules.pms.schemas.task import TaskResponse
from app.modules.pms.services.sprint import (
    complete_sprint,
    create_sprint,
    delete_sprint,
    get_backlog_tasks,
    get_sprint,
    get_sprint_board,
    list_sprints,
    start_sprint,
    update_sprint,
)
from app.modules.pms.services.sprint_analytics import (
    get_burndown_data,
    get_velocity_data,
)

router = APIRouter(prefix="/projects/{project_id}", tags=["sprints"])


@router.post("/sprints", response_model=SprintResponse, status_code=status.HTTP_201_CREATED)
async def create(
    project_id: uuid.UUID,
    data: SprintCreate,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    return await create_sprint(db, project_id, data, current_user)


@router.get("/sprints", response_model=list[SprintResponse])
async def list_(
    project_id: uuid.UUID,
    status_filter: SprintStatusFilter | None = Query(default=None, alias="status"),
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await list_sprints(db, project_id, status_filter)


@router.get("/sprints/{sprint_id}", response_model=SprintResponse)
async def get(
    project_id: uuid.UUID,
    sprint_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await get_sprint(db, sprint_id, project_id=project_id)


@router.patch("/sprints/{sprint_id}", response_model=SprintResponse)
async def update(
    project_id: uuid.UUID,
    sprint_id: uuid.UUID,
    data: SprintUpdate,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    return await update_sprint(db, sprint_id, data, project_id=project_id)


@router.delete("/sprints/{sprint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    project_id: uuid.UUID,
    sprint_id: uuid.UUID,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    await delete_sprint(db, sprint_id, project_id=project_id)


@router.post("/sprints/{sprint_id}/start", response_model=SprintResponse)
async def start(
    project_id: uuid.UUID,
    sprint_id: uuid.UUID,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    return await start_sprint(db, project_id, sprint_id)


@router.post("/sprints/{sprint_id}/complete", response_model=SprintResponse)
async def complete(
    project_id: uuid.UUID,
    sprint_id: uuid.UUID,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    return await complete_sprint(db, sprint_id, project_id=project_id)


@router.get("/sprints/{sprint_id}/board", response_model=SprintBoardResponse)
async def board(
    project_id: uuid.UUID,
    sprint_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await get_sprint_board(db, project_id, sprint_id)


@router.get("/backlog", response_model=list[TaskResponse])
async def backlog(
    project_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await get_backlog_tasks(db, project_id)


@router.get("/sprints/{sprint_id}/burndown", response_model=list[BurndownPoint])
async def burndown(
    project_id: uuid.UUID,
    sprint_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await get_burndown_data(db, project_id, sprint_id)


@router.get("/velocity", response_model=list[VelocityPoint])
async def velocity(
    project_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await get_velocity_data(db, project_id)
