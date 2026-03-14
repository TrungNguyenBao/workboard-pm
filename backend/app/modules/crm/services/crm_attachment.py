import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.crm_attachment import CrmAttachment

ALLOWED_EXTENSIONS = {"pdf", "docx", "xlsx", "pptx", "jpg", "jpeg", "png"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
UPLOAD_BASE = Path("uploads/crm")


def _get_extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def _validate_file(file: UploadFile, size: int) -> None:
    ext = _get_extension(file.filename or "")
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{ext}' not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )
    if size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File exceeds maximum size of 10MB",
        )


async def upload_attachment(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    entity_type: str,
    entity_id: uuid.UUID,
    category: str,
    file: UploadFile,
    uploaded_by: uuid.UUID | None = None,
) -> CrmAttachment:
    content = await file.read()
    _validate_file(file, len(content))

    ext = _get_extension(file.filename or "file")
    file_id = uuid.uuid4()
    safe_name = f"{file_id}_{file.filename}"
    dest_dir = UPLOAD_BASE / str(workspace_id) / entity_type
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / safe_name

    dest_path.write_bytes(content)

    file_url = str(dest_path).replace("\\", "/")
    item = CrmAttachment(
        workspace_id=workspace_id,
        entity_type=entity_type,
        entity_id=entity_id,
        file_name=file.filename or safe_name,
        file_url=file_url,
        file_size=len(content),
        file_type=ext,
        category=category,
        uploaded_by=uploaded_by,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def list_attachments(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    entity_type: str,
    entity_id: uuid.UUID,
) -> list[CrmAttachment]:
    result = await db.scalars(
        select(CrmAttachment).where(
            CrmAttachment.workspace_id == workspace_id,
            CrmAttachment.entity_type == entity_type,
            CrmAttachment.entity_id == entity_id,
        ).order_by(CrmAttachment.created_at.desc())
    )
    return list(result.all())


async def get_attachment(
    db: AsyncSession, attachment_id: uuid.UUID, workspace_id: uuid.UUID
) -> CrmAttachment:
    result = await db.scalars(
        select(CrmAttachment).where(
            CrmAttachment.id == attachment_id,
            CrmAttachment.workspace_id == workspace_id,
        )
    )
    item = result.first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")
    return item


async def delete_attachment(
    db: AsyncSession, attachment_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    item = await get_attachment(db, attachment_id, workspace_id)
    file_path = Path(item.file_url)
    if file_path.exists():
        file_path.unlink(missing_ok=True)
    await db.delete(item)
    await db.commit()
