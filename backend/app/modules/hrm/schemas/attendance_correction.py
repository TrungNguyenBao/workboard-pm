import uuid
from datetime import datetime
from datetime import time as time_type
from typing import Optional

from pydantic import BaseModel, Field, field_validator

VALID_STATUSES = {"pending", "approved", "rejected"}


class AttendanceCorrectionCreate(BaseModel):
    attendance_record_id: uuid.UUID
    employee_id: uuid.UUID
    original_check_in: Optional[time_type] = None
    original_check_out: Optional[time_type] = None
    corrected_check_in: Optional[time_type] = None
    corrected_check_out: Optional[time_type] = None
    reason: str = Field(min_length=1, max_length=500)


class AttendanceCorrectionUpdate(BaseModel):
    corrected_check_in: Optional[time_type] = None
    corrected_check_out: Optional[time_type] = None
    reason: Optional[str] = Field(default=None, min_length=1, max_length=500)
    status: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v


class AttendanceCorrectionResponse(BaseModel):
    id: uuid.UUID
    attendance_record_id: uuid.UUID
    employee_id: uuid.UUID
    workspace_id: uuid.UUID
    original_check_in: Optional[time_type] = None
    original_check_out: Optional[time_type] = None
    corrected_check_in: Optional[time_type] = None
    corrected_check_out: Optional[time_type] = None
    reason: str
    status: str
    approved_by_id: Optional[uuid.UUID] = None
    approved_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
