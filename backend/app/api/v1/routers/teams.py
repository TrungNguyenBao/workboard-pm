import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.team import Team, TeamMembership
from app.models.user import User
from app.schemas.team import TeamCreate, TeamResponse, TeamUpdate

router = APIRouter(prefix="/workspaces/{workspace_id}/teams", tags=["teams"])


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create(
    workspace_id: uuid.UUID,
    data: TeamCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    team = Team(workspace_id=workspace_id, **data.model_dump())
    db.add(team)
    await db.flush()
    db.add(TeamMembership(team_id=team.id, user_id=current_user.id, role="owner"))
    await db.commit()
    await db.refresh(team)
    return team


@router.get("", response_model=list[TeamResponse])
async def list_(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.scalars(
        select(Team).where(Team.workspace_id == workspace_id)
    )
    return list(result.all())


@router.patch("/{team_id}", response_model=TeamResponse)
async def update(
    workspace_id: uuid.UUID,
    team_id: uuid.UUID,
    data: TeamUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    team = await db.get(Team, team_id)
    if not team:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Team not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(team, field, value)
    await db.commit()
    await db.refresh(team)
    return team
