import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy.orm import selectinload

from app.models.comment import Comment
from app.models.project import Project
from app.models.task import Task, TaskFollower
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentResponse, CommentUpdate
from app.services.notifications import create_notification


async def create_comment(
    db: AsyncSession, task_id: uuid.UUID, data: CommentCreate, author: User
) -> Comment:
    comment = Comment(task_id=task_id, author_id=author.id, **data.model_dump())
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    # Notify task followers (excluding the author)
    task_row = await db.execute(select(Task.project_id).where(Task.id == task_id))
    project_id = task_row.scalar_one_or_none()
    if project_id:
        ws_row = await db.execute(select(Project.workspace_id).where(Project.id == project_id))
        workspace_id = ws_row.scalar_one_or_none()
        followers = await db.scalars(
            select(TaskFollower).where(
                TaskFollower.task_id == task_id,
                TaskFollower.user_id != author.id,
            )
        )
        for f in followers.all():
            await create_notification(
                db,
                user_id=f.user_id,
                actor_id=author.id,
                type="comment",
                title=f"{author.name} commented on a task",
                body=data.body_text[:200] if data.body_text else None,
                resource_type="task",
                resource_id=task_id,
                workspace_id=workspace_id,
            )

    return comment


async def list_comments(db: AsyncSession, task_id: uuid.UUID) -> list[CommentResponse]:
    result = await db.scalars(
        select(Comment)
        .where(Comment.task_id == task_id, Comment.deleted_at.is_(None))
        .options(selectinload(Comment.author))
        .order_by(Comment.created_at)
    )
    comments = result.all()
    return [
        CommentResponse(
            id=c.id,
            task_id=c.task_id,
            author_id=c.author_id,
            author_name=c.author.name,
            author_avatar_url=c.author.avatar_url,
            body=c.body,
            body_text=c.body_text,
            created_at=c.created_at,
            updated_at=c.updated_at,
        )
        for c in comments
    ]


async def update_comment(
    db: AsyncSession, comment_id: uuid.UUID, data: CommentUpdate, user: User
) -> Comment:
    comment = await db.get(Comment, comment_id)
    if not comment or comment.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    if comment.author_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your comment")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(comment, field, value)
    await db.commit()
    await db.refresh(comment)
    return comment


async def delete_comment(db: AsyncSession, comment_id: uuid.UUID, user: User) -> None:
    comment = await db.get(Comment, comment_id)
    if not comment or comment.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    if comment.author_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your comment")
    comment.deleted_at = datetime.now(timezone.utc)
    await db.commit()
