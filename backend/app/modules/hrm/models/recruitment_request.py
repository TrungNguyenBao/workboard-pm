import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class RecruitmentRequest(Base, TimestampMixin):
    __tablename__ = "recruitment_requests"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255))
    department_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("departments.id"), index=True)
    position_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("positions.id"), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    reason: Mapped[str] = mapped_column(String(500))
    requirements: Mapped[str | None] = mapped_column(Text, nullable=True)
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", server_default="draft")
    salary_range_min: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    salary_range_max: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    requester_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)

    department: Mapped["Department"] = relationship()  # noqa: F821
    position: Mapped["Position | None"] = relationship()  # noqa: F821
    requester: Mapped["User"] = relationship()  # noqa: F821
    workspace: Mapped["Workspace"] = relationship()  # noqa: F821
    candidates: Mapped[list["Candidate"]] = relationship(back_populates="recruitment_request", cascade="all, delete-orphan")  # noqa: F821
