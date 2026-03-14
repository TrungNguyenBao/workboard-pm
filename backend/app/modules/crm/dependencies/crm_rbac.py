"""CRM role-based access control dependency."""
import uuid
from typing import Callable

from fastapi import Depends, HTTPException, Path, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.workspace import WorkspaceMembership

# CRM permission matrix: role -> set of allowed entity types (write access)
CRM_PERMISSIONS: dict[str, set[str]] = {
    "admin": {
        "lead", "deal", "contact", "account", "activity", "campaign",
        "ticket", "product", "contract", "forecast", "notification",
        "attachment", "settings", "custom_field", "email_template", "import",
    },
    "sales_manager": {
        "lead", "deal", "contact", "account", "activity", "campaign",
        "ticket", "product", "contract", "forecast", "notification",
        "attachment", "custom_field",
    },
    "sales": {
        "lead", "deal", "contact", "account", "activity", "product",
        "contract", "notification", "attachment",
    },
    "marketing": {"campaign", "notification", "attachment"},
    "support": {"ticket", "contact", "account", "notification", "attachment"},
}

# Read-only access for roles that can view but not write certain entities
CRM_READ_PERMISSIONS: dict[str, set[str]] = {
    "marketing": {"lead", "deal", "contact", "account", "activity", "ticket"},
    "support": {"lead", "deal", "campaign", "activity"},
}

WORKSPACE_ROLE_RANK = {"admin": 3, "member": 2, "guest": 1}


def require_crm_permission(entity: str, action: str = "write") -> Callable:
    """Dependency that checks CRM role-based permission for an entity type and action."""
    async def _check(
        workspace_id: uuid.UUID = Path(...),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        membership = await db.scalar(
            select(WorkspaceMembership).where(
                WorkspaceMembership.workspace_id == workspace_id,
                WorkspaceMembership.user_id == current_user.id,
            )
        )
        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a workspace member")

        workspace_role = getattr(membership, "role", "guest")

        # Workspace admin bypasses all CRM role checks
        if workspace_role == "admin":
            return current_user

        # Guests: read-only access to support entity set only
        if workspace_role == "guest":
            if action == "read" and entity in CRM_READ_PERMISSIONS.get("support", set()):
                return current_user
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient CRM permission")

        # Members default to crm_role="sales" (crm_role column can be added later)
        crm_role: str = getattr(membership, "crm_role", None) or "sales"

        if action == "read":
            allowed = CRM_PERMISSIONS.get(crm_role, set()) | CRM_READ_PERMISSIONS.get(crm_role, set())
        else:
            allowed = CRM_PERMISSIONS.get(crm_role, set())

        if entity not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"CRM role '{crm_role}' cannot {action} '{entity}'",
            )
        return current_user

    return _check
