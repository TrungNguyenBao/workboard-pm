import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.modules.pms.dependencies.rbac import require_project_role
from app.modules.pms.schemas.attachment import AttachmentResponse
from app.modules.pms.services.attachment import (
    delete_attachment,
    get_attachment,
    list_attachments,
    upload_attachment,
)

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


@router.get("/{attachment_id}/download")
async def download(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    attachment_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    attachment = await get_attachment(db, attachment_id)
    if not attachment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")
    path = Path(attachment.storage_path)
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk")
    return FileResponse(
        path=str(path),
        filename=attachment.filename,
        media_type=attachment.mime_type,
    )


@router.delete("/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    attachment_id: uuid.UUID,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    await delete_attachment(db, attachment_id, current_user)
