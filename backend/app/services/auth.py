import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.token import RefreshToken
from app.models.user import User
from app.schemas.auth import RegisterRequest


async def register_user(db: AsyncSession, data: RegisterRequest) -> User:
    existing = await db.scalar(select(User).where(User.email == data.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(
        email=data.email,
        name=data.name,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def login_user(db: AsyncSession, email: str, password: str) -> tuple[User, str, str]:
    """Returns (user, access_token, raw_refresh_token)."""
    user = await db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    access_token = create_access_token(user.id)
    raw_refresh, token_hash = create_refresh_token()
    family = secrets.token_urlsafe(32)

    rt = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        family=family,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(rt)
    await db.commit()
    return user, access_token, raw_refresh


async def refresh_tokens(
    db: AsyncSession, raw_refresh_token: str
) -> tuple[User, str, str]:
    """Returns (user, new_access_token, new_raw_refresh_token). Implements family invalidation."""
    token_hash = hashlib.sha256(raw_refresh_token.encode()).hexdigest()
    rt = await db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    if not rt:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    if rt.is_revoked:
        # Token reuse detected — revoke entire family
        family_tokens = await db.scalars(
            select(RefreshToken).where(RefreshToken.family == rt.family)
        )
        for t in family_tokens:
            t.is_revoked = True
        await db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token reuse detected")

    if rt.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

    # Revoke old token
    rt.is_revoked = True

    user = await db.get(User, rt.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    access_token = create_access_token(user.id)
    raw_refresh, new_hash = create_refresh_token()

    new_rt = RefreshToken(
        user_id=user.id,
        token_hash=new_hash,
        family=rt.family,  # keep same family
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(new_rt)
    await db.commit()
    return user, access_token, raw_refresh


async def update_user(db: AsyncSession, user: User, data) -> User:
    """Update user profile. `data` is a UserUpdateRequest instance."""
    if data.new_password:
        if not data.current_password:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password required")
        if not verify_password(data.current_password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password incorrect")
        user.hashed_password = hash_password(data.new_password)
    if data.name is not None:
        user.name = data.name
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url
    await db.commit()
    await db.refresh(user)
    return user


async def logout_user(db: AsyncSession, raw_refresh_token: str) -> None:
    token_hash = hashlib.sha256(raw_refresh_token.encode()).hexdigest()
    rt = await db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    if rt:
        rt.is_revoked = True
        await db.commit()
