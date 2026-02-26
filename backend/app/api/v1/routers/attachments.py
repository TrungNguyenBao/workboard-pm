import uuid

from fastapi import APIRouter, Depends, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.rbac import require_project_role
from app.models.user import User
from app.schemas.attachment import AttachmentResponse
from app.services.attachment import delete_attachment, list_attachments, upload_attachment

router = APIRouter(prefix="/projects/{project_id}/tasks/{task_id}/attachments", tags=["attachments"])


@router.post("", response_model=AttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    file: UploadFile,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    return await upload_attachment(db, task_id, file, current_user)


@router.get("", response_model=list[AttachmentResponse])
async def list_(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await list_attachments(db, task_id)


@router.delete("/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    attachment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await delete_attachment(db, attachment_id, current_user)
