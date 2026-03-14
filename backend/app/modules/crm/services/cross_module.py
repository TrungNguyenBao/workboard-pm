"""Cross-module integration services for CRM."""
import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.services.deal import get_deal


async def create_project_from_deal(
    db: AsyncSession,
    deal_id: uuid.UUID,
    workspace_id: uuid.UUID,
    user: object | None = None,
) -> dict:
    """Create a PMS project from a closed_won deal."""
    deal = await get_deal(db, deal_id, workspace_id)

    if deal.stage != "closed_won":
        raise HTTPException(status_code=400, detail="Only won deals can create projects")

    try:
        from app.modules.pms.schemas.project import ProjectCreate
        from app.modules.pms.services.project import create_project

        if user is None:
            raise ImportError("user required for PMS project creation")

        project = await create_project(
            db,
            workspace_id,
            ProjectCreate(
                name=f"Project - {deal.title}",
                description=f"From CRM deal, value={deal.value}",
            ),
            owner=user,
        )
        return {"project_id": str(project.id), "name": project.name}
    except ImportError:
        raise HTTPException(status_code=501, detail="PMS module not available")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to create project: {exc}") from exc
