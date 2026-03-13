import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.onboarding_checklist import OnboardingChecklist
from app.modules.hrm.schemas.onboarding_checklist import (
    OnboardingChecklistCreate,
    OnboardingChecklistUpdate,
)

DEFAULT_TASKS = [
    ("IT setup", "Email account setup"),
    ("IT setup", "Laptop and hardware provisioning"),
    ("IT setup", "Software access and licenses"),
    ("HR docs", "Employment contract signing"),
    ("HR docs", "NDA signing"),
    ("HR docs", "Tax form submission"),
    ("Training", "Company orientation"),
    ("Training", "Safety training"),
]


async def create_onboarding_checklist(
    db: AsyncSession, workspace_id: uuid.UUID, data: OnboardingChecklistCreate
) -> OnboardingChecklist:
    item = OnboardingChecklist(workspace_id=workspace_id, **data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def list_onboarding_checklists(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[OnboardingChecklist], int]:
    q = select(OnboardingChecklist).where(OnboardingChecklist.workspace_id == workspace_id)
    count_q = select(func.count(OnboardingChecklist.id)).where(OnboardingChecklist.workspace_id == workspace_id)

    if employee_id:
        q = q.where(OnboardingChecklist.employee_id == employee_id)
        count_q = count_q.where(OnboardingChecklist.employee_id == employee_id)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(OnboardingChecklist.created_at.asc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_onboarding_checklist(
    db: AsyncSession, item_id: uuid.UUID, workspace_id: uuid.UUID
) -> OnboardingChecklist:
    result = await db.scalars(
        select(OnboardingChecklist).where(
            OnboardingChecklist.id == item_id, OnboardingChecklist.workspace_id == workspace_id
        )
    )
    item = result.first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Onboarding checklist item not found")
    return item


async def update_onboarding_checklist(
    db: AsyncSession, item_id: uuid.UUID, workspace_id: uuid.UUID, data: OnboardingChecklistUpdate
) -> OnboardingChecklist:
    item = await get_onboarding_checklist(db, item_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return item


async def toggle_completion(
    db: AsyncSession, item_id: uuid.UUID, workspace_id: uuid.UUID
) -> OnboardingChecklist:
    item = await get_onboarding_checklist(db, item_id, workspace_id)
    item.is_completed = not item.is_completed
    item.completed_at = datetime.now(timezone.utc) if item.is_completed else None
    await db.commit()
    await db.refresh(item)
    return item


async def generate_default_checklist(
    db: AsyncSession, workspace_id: uuid.UUID, employee_id: uuid.UUID
) -> list[OnboardingChecklist]:
    items = []
    for category, task_name in DEFAULT_TASKS:
        item = OnboardingChecklist(
            workspace_id=workspace_id,
            employee_id=employee_id,
            task_name=task_name,
            category=category,
        )
        db.add(item)
        items.append(item)
    await db.commit()
    for item in items:
        await db.refresh(item)
    return items


async def delete_onboarding_checklist(
    db: AsyncSession, item_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    item = await get_onboarding_checklist(db, item_id, workspace_id)
    await db.delete(item)
    await db.commit()
