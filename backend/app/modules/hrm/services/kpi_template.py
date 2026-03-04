import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.kpi_template import KpiTemplate
from app.modules.hrm.schemas.kpi_template import KpiTemplateCreate, KpiTemplateUpdate


async def create_kpi_template(
    db: AsyncSession, workspace_id: uuid.UUID, data: KpiTemplateCreate
) -> KpiTemplate:
    tpl = KpiTemplate(workspace_id=workspace_id, **data.model_dump())
    db.add(tpl)
    await db.commit()
    await db.refresh(tpl)
    return tpl


async def list_kpi_templates(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[KpiTemplate], int]:
    q = select(KpiTemplate).where(KpiTemplate.workspace_id == workspace_id)
    count_q = select(func.count(KpiTemplate.id)).where(KpiTemplate.workspace_id == workspace_id)

    if search:
        like = f"%{search}%"
        q = q.where(KpiTemplate.name.ilike(like))
        count_q = count_q.where(KpiTemplate.name.ilike(like))

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(KpiTemplate.name).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_kpi_template(
    db: AsyncSession, template_id: uuid.UUID, workspace_id: uuid.UUID
) -> KpiTemplate:
    result = await db.scalars(
        select(KpiTemplate).where(
            KpiTemplate.id == template_id, KpiTemplate.workspace_id == workspace_id
        )
    )
    tpl = result.first()
    if not tpl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="KPI template not found")
    return tpl


async def update_kpi_template(
    db: AsyncSession, template_id: uuid.UUID, workspace_id: uuid.UUID, data: KpiTemplateUpdate
) -> KpiTemplate:
    tpl = await get_kpi_template(db, template_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(tpl, field, value)
    await db.commit()
    await db.refresh(tpl)
    return tpl


async def delete_kpi_template(
    db: AsyncSession, template_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    tpl = await get_kpi_template(db, template_id, workspace_id)
    await db.delete(tpl)
    await db.commit()
