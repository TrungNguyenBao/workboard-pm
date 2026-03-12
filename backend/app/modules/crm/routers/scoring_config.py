import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.scoring_config import ScoringConfigResponse, ScoringConfigUpdate
from app.modules.crm.services.scoring_config import get_scoring_config, update_scoring_config

router = APIRouter(tags=["crm"])


@router.get(
    "/workspaces/{workspace_id}/scoring-config",
    response_model=ScoringConfigResponse,
)
async def get_config(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_scoring_config(db, workspace_id)


@router.put(
    "/workspaces/{workspace_id}/scoring-config",
    response_model=ScoringConfigResponse,
)
async def update_config(
    workspace_id: uuid.UUID,
    data: ScoringConfigUpdate,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await update_scoring_config(db, workspace_id, data)
