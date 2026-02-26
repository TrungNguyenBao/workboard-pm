import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.notification import NotificationResponse
from app.services.notifications import list_notifications, mark_read

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationResponse])
async def list_(
    unread_only: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await list_notifications(db, current_user.id, unread_only)


@router.patch("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await mark_read(db, notification_id, current_user.id)
