import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.email_template import EmailTemplate
from app.modules.crm.schemas.email_template import EmailTemplateCreate, EmailTemplateUpdate


async def create_email_template(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    data: EmailTemplateCreate,
    created_by: uuid.UUID,
) -> EmailTemplate:
    template = EmailTemplate(
        workspace_id=workspace_id,
        created_by=created_by,
        **data.model_dump(),
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


async def list_email_templates(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    category: str | None = None,
    is_active: bool | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[EmailTemplate], int]:
    q = select(EmailTemplate).where(EmailTemplate.workspace_id == workspace_id)
    count_q = select(func.count(EmailTemplate.id)).where(EmailTemplate.workspace_id == workspace_id)

    if category:
        q = q.where(EmailTemplate.category == category)
        count_q = count_q.where(EmailTemplate.category == category)
    if is_active is not None:
        q = q.where(EmailTemplate.is_active == is_active)
        count_q = count_q.where(EmailTemplate.is_active == is_active)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(EmailTemplate.name).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_email_template(
    db: AsyncSession, template_id: uuid.UUID, workspace_id: uuid.UUID
) -> EmailTemplate:
    result = await db.scalars(
        select(EmailTemplate).where(
            EmailTemplate.id == template_id,
            EmailTemplate.workspace_id == workspace_id,
        )
    )
    template = result.first()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email template not found")
    return template


async def update_email_template(
    db: AsyncSession,
    template_id: uuid.UUID,
    workspace_id: uuid.UUID,
    data: EmailTemplateUpdate,
) -> EmailTemplate:
    template = await get_email_template(db, template_id, workspace_id)
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(template, key, value)
    await db.commit()
    await db.refresh(template)
    return template


async def delete_email_template(
    db: AsyncSession, template_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    template = await get_email_template(db, template_id, workspace_id)
    await db.delete(template)
    await db.commit()
