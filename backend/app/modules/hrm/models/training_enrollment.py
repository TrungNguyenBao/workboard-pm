import uuid

from sqlalchemy import Date, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class TrainingEnrollment(Base, TimestampMixin):
    __tablename__ = "training_enrollments"

    __table_args__ = (
        UniqueConstraint("program_id", "employee_id", name="uq_enrollment_program_employee"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    program_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("training_programs.id", ondelete="CASCADE"), index=True
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[str] = mapped_column(String(20), default="enrolled")
    completion_date: Mapped[object | None] = mapped_column(Date, nullable=True)
    score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)

    program: Mapped["TrainingProgram"] = relationship(back_populates="enrollments")  # noqa: F821
    employee: Mapped["Employee"] = relationship()  # noqa: F821
    workspace: Mapped["Workspace"] = relationship()  # noqa: F821
