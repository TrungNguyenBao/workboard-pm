import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comment import Comment
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentUpdate


async def create_comment(
    db: AsyncSession, task_id: uuid.UUID, data: CommentCreate, author: User
) -> Comment:
    comment = Comment(task_id=task_id, author_id=author.id, **data.model_dump())
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment


async def list_comments(db: AsyncSession, task_id: uuid.UUID) -> list[Comment]:
    result = await db.scalars(
        select(Comment)
        .where(Comment.task_id == task_id, Comment.deleted_at.is_(None))
        .order_by(Comment.created_at)
    )
    return list(result.all())


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
