import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_project_role
from app.models.user import User
from app.schemas.project import SectionCreate, SectionResponse, SectionUpdate
from app.services.project import create_section, list_sections, update_section

router = APIRouter(prefix="/projects/{project_id}/sections", tags=["sections"])


@router.get("", response_model=list[SectionResponse])
async def list_(
    project_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await list_sections(db, project_id)


@router.post("", response_model=SectionResponse, status_code=status.HTTP_201_CREATED)
async def create(
    project_id: uuid.UUID,
    data: SectionCreate,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    return await create_section(db, project_id, data)


@router.patch("/{section_id}", response_model=SectionResponse)
async def update(
    project_id: uuid.UUID,
    section_id: uuid.UUID,
    data: SectionUpdate,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    return await update_section(db, section_id, data)
