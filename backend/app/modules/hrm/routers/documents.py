"""HRM document upload / list / delete endpoints."""
import uuid

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.hrm.schemas.hrm_document import HrmDocumentResponse
from app.modules.hrm.services.hrm_document import (
    delete_document,
    list_documents,
    upload_document,
)

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/documents",
    response_model=HrmDocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload(
    workspace_id: uuid.UUID,
    entity_type: str = Query(...),
    entity_id: uuid.UUID = Query(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await upload_document(db, workspace_id, entity_type, entity_id, file, current_user.id)


@router.get(
    "/workspaces/{workspace_id}/documents",
    response_model=list[HrmDocumentResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    entity_type: str = Query(...),
    entity_id: uuid.UUID = Query(...),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await list_documents(db, workspace_id, entity_type, entity_id)


@router.delete(
    "/workspaces/{workspace_id}/documents/{doc_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    doc_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    await delete_document(db, workspace_id, doc_id, current_user.id)
