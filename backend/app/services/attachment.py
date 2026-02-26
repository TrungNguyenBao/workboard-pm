import uuid
from pathlib import Path

import aiofiles
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.attachment import Attachment
from app.models.user import User


async def upload_attachment(
    db: AsyncSession, task_id: uuid.UUID, file: UploadFile, uploader: User
) -> Attachment:
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit",
        )

    dest_dir = Path(settings.UPLOAD_DIR) / str(task_id)
    dest_dir.mkdir(parents=True, exist_ok=True)
    safe_name = Path(file.filename or "upload").name
    dest_path = dest_dir / f"{uuid.uuid4()}_{safe_name}"

    async with aiofiles.open(dest_path, "wb") as f:
        await f.write(content)

    attachment = Attachment(
        task_id=task_id,
        uploaded_by_id=uploader.id,
        filename=safe_name,
        storage_path=str(dest_path),
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=len(content),
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)
    return attachment


async def list_attachments(db: AsyncSession, task_id: uuid.UUID) -> list[Attachment]:
    result = await db.scalars(
        select(Attachment).where(Attachment.task_id == task_id).order_by(Attachment.created_at)
    )
    return list(result.all())


async def delete_attachment(
    db: AsyncSession, attachment_id: uuid.UUID, user: User
) -> None:
    attachment = await db.get(Attachment, attachment_id)
    if not attachment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")
    if attachment.uploaded_by_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your attachment")
    # Delete file
    path = Path(attachment.storage_path)
    if path.exists():
        path.unlink()
    await db.delete(attachment)
    await db.commit()
