import uuid

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    workspace_memberships: Mapped[list["WorkspaceMembership"]] = relationship(  # noqa: F821
        back_populates="user"
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(  # noqa: F821
        back_populates="user"
    )
    notifications: Mapped[list["Notification"]] = relationship(  # noqa: F821
        back_populates="user", foreign_keys="Notification.user_id"
    )
