import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.modules.pms.dependencies.rbac import require_project_role
from app.modules.pms.models.task import TaskFollower

router = APIRouter(
    prefix="/projects/{project_id}/tasks/{task_id}/followers",
    tags=["followers"],
)


class FollowerResponse(BaseModel):
    user_id: uuid.UUID
    user_name: str
    user_email: str

    model_config = {"from_attributes": True}


@router.get("", response_model=list[FollowerResponse])
async def list_followers(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TaskFollower).where(TaskFollower.task_id == task_id)
    )
    rows = result.scalars().all()
    user_ids = [r.user_id for r in rows]
    if not user_ids:
        return []
    users_result = await db.execute(select(User).where(User.id.in_(user_ids)))
    users = {u.id: u for u in users_result.scalars().all()}
    return [
        FollowerResponse(user_id=uid, user_name=users[uid].name, user_email=users[uid].email)
        for uid in user_ids
        if uid in users
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
async def follow_task(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.get(TaskFollower, (task_id, current_user.id))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already following")
    db.add(TaskFollower(task_id=task_id, user_id=current_user.id))
    await db.commit()
    return {"task_id": task_id, "user_id": current_user.id}


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def unfollow_task(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        delete(TaskFollower).where(
            TaskFollower.task_id == task_id,
            TaskFollower.user_id == current_user.id,
        )
    )
    await db.commit()
