import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.hrm.models.purchase_request import PurchaseRequest
from app.modules.hrm.schemas.purchase_request import PurchaseRequestCreate, PurchaseRequestUpdate


async def create_purchase_request(
    db: AsyncSession, workspace_id: uuid.UUID, requester_id: uuid.UUID, data: PurchaseRequestCreate
) -> PurchaseRequest:
    pr = PurchaseRequest(workspace_id=workspace_id, requester_id=requester_id, **data.model_dump())
    db.add(pr)
    await db.commit()
    await db.refresh(pr)
    return pr


async def list_purchase_requests(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    pr_status: str | None = None,
    requester_id: uuid.UUID | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[PurchaseRequest], int]:
    q = select(PurchaseRequest).where(PurchaseRequest.workspace_id == workspace_id)
    count_q = select(func.count(PurchaseRequest.id)).where(PurchaseRequest.workspace_id == workspace_id)

    if pr_status:
        q = q.where(PurchaseRequest.status == pr_status)
        count_q = count_q.where(PurchaseRequest.status == pr_status)
    if requester_id:
        q = q.where(PurchaseRequest.requester_id == requester_id)
        count_q = count_q.where(PurchaseRequest.requester_id == requester_id)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.options(selectinload(PurchaseRequest.items))
        .order_by(PurchaseRequest.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(result.all()), total


async def get_purchase_request(
    db: AsyncSession, pr_id: uuid.UUID, workspace_id: uuid.UUID
) -> PurchaseRequest:
    result = await db.scalars(
        select(PurchaseRequest)
        .where(PurchaseRequest.id == pr_id, PurchaseRequest.workspace_id == workspace_id)
        .options(selectinload(PurchaseRequest.items))
    )
    pr = result.first()
    if not pr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase request not found")
    return pr


async def update_purchase_request(
    db: AsyncSession, pr_id: uuid.UUID, workspace_id: uuid.UUID, data: PurchaseRequestUpdate
) -> PurchaseRequest:
    pr = await get_purchase_request(db, pr_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(pr, field, value)
    await db.commit()
    await db.refresh(pr)
    return pr


async def delete_purchase_request(
    db: AsyncSession, pr_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    pr = await get_purchase_request(db, pr_id, workspace_id)
    await db.delete(pr)
    await db.commit()


async def submit_request(
    db: AsyncSession, pr_id: uuid.UUID, workspace_id: uuid.UUID
) -> PurchaseRequest:
    pr = await get_purchase_request(db, pr_id, workspace_id)
    if pr.status != "draft":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only draft requests can be submitted")
    pr.status = "submitted"
    await db.commit()
    await db.refresh(pr)
    return pr


async def approve_request(
    db: AsyncSession, pr_id: uuid.UUID, workspace_id: uuid.UUID, approver_id: uuid.UUID
) -> PurchaseRequest:
    pr = await get_purchase_request(db, pr_id, workspace_id)
    if pr.status != "submitted":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only submitted requests can be approved")
    pr.status = "approved"
    pr.approved_by_id = approver_id
    await db.commit()
    await db.refresh(pr)
    return pr


async def reject_request(
    db: AsyncSession, pr_id: uuid.UUID, workspace_id: uuid.UUID
) -> PurchaseRequest:
    pr = await get_purchase_request(db, pr_id, workspace_id)
    if pr.status != "submitted":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only submitted requests can be rejected")
    pr.status = "rejected"
    await db.commit()
    await db.refresh(pr)
    return pr
