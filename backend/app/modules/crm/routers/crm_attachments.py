import uuid

from fastapi import APIRouter, Depends, Form, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.crm_attachment import CrmAttachmentResponse
from app.modules.crm.services.crm_attachment import (
    delete_attachment,
    get_attachment,
    list_attachments,
    upload_attachment,
)

router = APIRouter(tags=["crm"])


@router.post(
    "/workspaces/{workspace_id}/attachments",
    response_model=CrmAttachmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload(
    workspace_id: uuid.UUID,
    file: UploadFile,
    entity_type: str = Form(...),
    entity_id: uuid.UUID = Form(...),
    category: str = Form(default="other"),
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await upload_attachment(
        db, workspace_id, entity_type, entity_id, category, file, uploaded_by=current_user.id
    )


@router.get(
    "/workspaces/{workspace_id}/attachments",
    response_model=list[CrmAttachmentResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    entity_type: str,
    entity_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await list_attachments(db, workspace_id, entity_type, entity_id)


@router.get("/workspaces/{workspace_id}/attachments/{attachment_id}/download")
async def download(
    workspace_id: uuid.UUID,
    attachment_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    item = await get_attachment(db, attachment_id, workspace_id)
    return FileResponse(path=item.file_url, filename=item.file_name, media_type="application/octet-stream")


@router.delete(
    "/workspaces/{workspace_id}/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    attachment_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    await delete_attachment(db, attachment_id, workspace_id)
