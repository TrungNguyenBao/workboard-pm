import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Candidate(Base, TimestampMixin):
    __tablename__ = "candidates"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    recruitment_request_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("recruitment_requests.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    resume_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="applied")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)

    recruitment_request: Mapped["RecruitmentRequest"] = relationship(back_populates="candidates")  # noqa: F821
    workspace: Mapped["Workspace"] = relationship()  # noqa: F821
    interviews: Mapped[list["Interview"]] = relationship(back_populates="candidate", cascade="all, delete-orphan")  # noqa: F821
    offers: Mapped[list["Offer"]] = relationship(back_populates="candidate", cascade="all, delete-orphan")  # noqa: F821
