import uuid

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.email_log import EmailLogResponse, PaginatedEmailLogs, SendEmailRequest
from app.modules.crm.services.email_log import list_emails, send_email, track_email_event

router = APIRouter(tags=["crm"])

# 1x1 transparent GIF bytes
_TRACKING_GIF = (
    b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00"
    b"\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x00\x00\x00\x00"
    b"\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02"
    b"\x44\x01\x00\x3b"
)


@router.post(
    "/workspaces/{workspace_id}/emails/send",
    response_model=EmailLogResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send(
    workspace_id: uuid.UUID,
    data: SendEmailRequest,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await send_email(db, workspace_id, data, user_id=current_user.id)


@router.get(
    "/workspaces/{workspace_id}/emails",
    response_model=PaginatedEmailLogs,
)
async def list_(
    workspace_id: uuid.UUID,
    contact_id: uuid.UUID | None = Query(default=None),
    deal_id: uuid.UUID | None = Query(default=None),
    lead_id: uuid.UUID | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_emails(db, workspace_id, contact_id, deal_id, lead_id, page, page_size)
    return PaginatedEmailLogs(items=items, total=total, page=page, page_size=page_size)


@router.get("/workspaces/{workspace_id}/emails/{email_id}/track")
async def track(
    workspace_id: uuid.UUID,
    email_id: uuid.UUID,
    event: str = Query(default="open"),
    db: AsyncSession = Depends(get_db),
):
    """Tracking pixel endpoint — returns 1x1 transparent GIF and records open/click."""
    try:
        await track_email_event(db, email_id, workspace_id, event)
    except Exception:
        pass  # Never fail tracking silently
    return Response(content=_TRACKING_GIF, media_type="image/gif")
