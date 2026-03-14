import json
import uuid

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.models.import_job import ImportJob
from app.modules.crm.schemas.import_job import ImportJobResponse
from app.modules.crm.services.export_service import (
    export_contacts_csv,
    export_leads_csv,
    export_pipeline_csv,
)
from app.modules.crm.services.import_service import create_import_job, process_import

router = APIRouter(tags=["crm"])


@router.post(
    "/workspaces/{workspace_id}/import",
    response_model=ImportJobResponse,
    status_code=201,
)
async def import_csv(
    workspace_id: uuid.UUID,
    file: UploadFile = File(...),
    type: str = Form(...),
    column_mapping: str | None = Form(default=None),
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    mapping = json.loads(column_mapping) if column_mapping else None
    job = await create_import_job(db, workspace_id, file, type, mapping, current_user.id)
    # Process synchronously (KISS — no ARQ for now)
    job = await process_import(db, job.id)
    return job


@router.get(
    "/workspaces/{workspace_id}/import-jobs",
    response_model=list[ImportJobResponse],
)
async def list_import_jobs(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.scalars(
        select(ImportJob)
        .where(ImportJob.workspace_id == workspace_id)
        .order_by(ImportJob.created_at.desc())
    )
    return list(result.all())


@router.get(
    "/workspaces/{workspace_id}/import-jobs/{job_id}",
    response_model=ImportJobResponse,
)
async def get_import_job(
    workspace_id: uuid.UUID,
    job_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    from fastapi import HTTPException, status

    job = await db.scalar(
        select(ImportJob).where(
            ImportJob.id == job_id,
            ImportJob.workspace_id == workspace_id,
        )
    )
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Import job not found")
    return job


@router.get("/workspaces/{workspace_id}/export/leads")
async def export_leads(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    csv_data = await export_leads_csv(db, workspace_id)
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads.csv"},
    )


@router.get("/workspaces/{workspace_id}/export/contacts")
async def export_contacts(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    csv_data = await export_contacts_csv(db, workspace_id)
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=contacts.csv"},
    )


@router.get("/workspaces/{workspace_id}/export/pipeline")
async def export_pipeline(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    csv_data = await export_pipeline_csv(db, workspace_id)
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=pipeline.csv"},
    )
