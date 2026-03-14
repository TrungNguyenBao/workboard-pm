"""Cross-module integration endpoints for CRM."""
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User

router = APIRouter(tags=["crm"])


@router.post("/workspaces/{workspace_id}/deals/{deal_id}/create-project")
async def create_project_from_deal(
    workspace_id: uuid.UUID,
    deal_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Create a PMS project from a closed_won CRM deal."""
    from app.modules.crm.services.cross_module import create_project_from_deal as svc

    return await svc(db, deal_id, workspace_id, user=current_user)
