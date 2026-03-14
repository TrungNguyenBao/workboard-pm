import csv
import os
import uuid
from typing import Any

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.contact import Contact
from app.modules.crm.models.import_job import ImportJob
from app.modules.crm.models.lead import Lead

UPLOAD_DIR = "uploads/crm"


async def create_import_job(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    file: UploadFile,
    entity_type: str,
    column_mapping: dict | None,
    user_id: uuid.UUID | None,
) -> ImportJob:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_name = file.filename or "import.csv"
    safe_name = f"{uuid.uuid4()}_{file_name}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    job = ImportJob(
        workspace_id=workspace_id,
        type=entity_type,
        file_name=file_name,
        file_url=file_path,
        column_mapping=column_mapping,
        created_by=user_id,
        status="pending",
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


async def process_import(db: AsyncSession, job_id: uuid.UUID) -> ImportJob:
    job = await db.scalar(select(ImportJob).where(ImportJob.id == job_id))
    if not job:
        raise ValueError("Job not found")

    job.status = "processing"
    await db.commit()

    errors: list[dict[str, Any]] = []
    imported = 0
    failed = 0
    total = 0

    try:
        with open(job.file_url, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            mapping: dict = job.column_mapping or {}
            rows = list(reader)
            total = len(rows)
            job.total_rows = total

            for i, row in enumerate(rows):
                try:
                    mapped = {mapping.get(k, k): v for k, v in row.items()}
                    await _import_row(db, job.workspace_id, job.type, mapped, job.created_by)
                    imported += 1
                except Exception as e:
                    failed += 1
                    errors.append({"row": i + 2, "error": str(e)})

        await db.commit()
    except Exception as e:
        job.status = "failed"
        job.error_log = {"fatal": str(e)}
        await db.commit()
        await db.refresh(job)
        return job

    job.status = "completed"
    job.total_rows = total
    job.imported_rows = imported
    job.failed_rows = failed
    job.error_log = {"rows": errors} if errors else None
    await db.commit()
    await db.refresh(job)
    return job


async def _import_row(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    entity_type: str,
    row: dict,
    user_id: uuid.UUID | None,
) -> None:
    email = row.get("email", "").strip()

    if entity_type == "lead":
        name = row.get("name", "").strip()
        if not name:
            raise ValueError("name is required")
        if email:
            exists = await db.scalar(
                select(Lead).where(Lead.email == email, Lead.workspace_id == workspace_id)
            )
            if exists:
                raise ValueError(f"duplicate email: {email}")
        lead = Lead(
            workspace_id=workspace_id,
            name=name,
            email=email or None,
            phone=row.get("phone") or None,
            source=row.get("source", "import"),
            status=row.get("status", "new"),
        )
        db.add(lead)

    elif entity_type == "contact":
        name = row.get("name", "").strip()
        if not name:
            raise ValueError("name is required")
        if email:
            exists = await db.scalar(
                select(Contact).where(Contact.email == email, Contact.workspace_id == workspace_id)
            )
            if exists:
                raise ValueError(f"duplicate email: {email}")
        contact = Contact(
            workspace_id=workspace_id,
            name=name,
            email=email or None,
            phone=row.get("phone") or None,
            company=row.get("company") or None,
        )
        db.add(contact)
    else:
        raise ValueError(f"unsupported entity_type: {entity_type}")
