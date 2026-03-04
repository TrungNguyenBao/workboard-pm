import uuid
from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


AttendanceStatus = Literal["present", "absent", "late", "half_day", "holiday", "leave"]


class AttendanceRecordCreate(BaseModel):
    employee_id: uuid.UUID
    date: date
    check_in: str | None = None   # "HH:MM:SS" or "HH:MM"
    check_out: str | None = None
    status: AttendanceStatus = "present"
    total_hours: Decimal | None = Field(default=None, ge=0)
    overtime_hours: Decimal = Field(default=Decimal("0"), ge=0)
    notes: str | None = Field(default=None, max_length=255)


class AttendanceRecordUpdate(BaseModel):
    check_in: str | None = None
    check_out: str | None = None
    status: AttendanceStatus | None = None
    total_hours: Decimal | None = Field(default=None, ge=0)
    overtime_hours: Decimal | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None, max_length=255)


class AttendanceRecordResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    date: date
    check_in: str | None
    check_out: str | None
    status: str
    total_hours: Decimal | None
    overtime_hours: Decimal
    notes: str | None
    workspace_id: uuid.UUID

    model_config = {"from_attributes": True}


class AttendanceMonthlySummary(BaseModel):
    employee_id: uuid.UUID
    employee_name: str
    period: str   # YYYY-MM
    present_days: int
    absent_days: int
    late_days: int
    half_day_count: int
    holiday_count: int
    leave_count: int
    total_hours: Decimal
    overtime_hours: Decimal
