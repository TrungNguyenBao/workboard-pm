"""HRM document upload, list, and delete service."""
import re
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.modules.hrm.models.hrm_document import ALLOWED_MIME_TYPES, MAX_FILE_SIZE, HrmDocument


def _sanitize_filename(name: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]", "_", name)


def _upload_path(workspace_id: uuid.UUID, entity_id: uuid.UUID, filename: str) -> Path:
    return Path(settings.UPLOAD_DIR) / "hrm" / str(workspace_id) / str(entity_id) / filename


async def upload_document(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    entity_type: str,
    entity_id: uuid.UUID,
    file: UploadFile,
    uploader_id: uuid.UUID,
) -> HrmDocument:
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds 10 MB limit",
        )

    safe_name = _sanitize_filename(file.filename or "upload")
    dest = _upload_path(workspace_id, entity_id, safe_name)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(contents)

    doc = HrmDocument(
        entity_type=entity_type,
        entity_id=entity_id,
        filename=safe_name,
        file_path=str(dest.relative_to(Path(settings.UPLOAD_DIR))),
        file_size=len(contents),
        mime_type=file.content_type,
        uploaded_by_id=uploader_id,
        workspace_id=workspace_id,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


async def list_documents(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    entity_type: str,
    entity_id: uuid.UUID,
) -> list[HrmDocument]:
    result = await db.scalars(
        select(HrmDocument).where(
            HrmDocument.workspace_id == workspace_id,
            HrmDocument.entity_type == entity_type,
            HrmDocument.entity_id == entity_id,
        )
    )
    return list(result.all())


async def delete_document(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    doc_id: uuid.UUID,
    requester_id: uuid.UUID,
) -> None:
    doc = await db.get(HrmDocument, doc_id)
    if not doc or doc.workspace_id != workspace_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    file_path = Path(settings.UPLOAD_DIR) / doc.file_path
    if file_path.exists():
        file_path.unlink()

    await db.delete(doc)
    await db.commit()
