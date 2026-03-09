import uuid
from decimal import Decimal

from pydantic import BaseModel, Field


class PayrollRecordCreate(BaseModel):
    employee_id: uuid.UUID
    period: str = Field(min_length=7, max_length=7, pattern=r"^\d{4}-\d{2}$")
    gross: float = Field(default=0, ge=0)
    net: float = Field(default=0, ge=0)
    deductions: dict | None = None
    # Enhanced C&B fields (all optional for backward compatibility)
    base_salary: Decimal | None = Field(default=None, ge=0)
    allowances: dict | None = None
    bhxh_employee: Decimal = Field(default=Decimal("0"), ge=0)
    bhxh_employer: Decimal = Field(default=Decimal("0"), ge=0)
    bhyt_employee: Decimal = Field(default=Decimal("0"), ge=0)
    bhyt_employer: Decimal = Field(default=Decimal("0"), ge=0)
    bhtn_employee: Decimal = Field(default=Decimal("0"), ge=0)
    bhtn_employer: Decimal = Field(default=Decimal("0"), ge=0)
    taxable_income: Decimal = Field(default=Decimal("0"), ge=0)
    personal_deduction: Decimal = Field(default=Decimal("11000000"), ge=0)
    dependent_deduction: Decimal = Field(default=Decimal("0"), ge=0)
    pit_amount: Decimal = Field(default=Decimal("0"), ge=0)
    working_days: int | None = None
    actual_working_days: int | None = None
    ot_pay: Decimal | None = Field(default=None, ge=0)
    dependents: int = Field(default=0, ge=0)


class PayrollRecordUpdate(BaseModel):
    gross: float | None = Field(default=None, ge=0)
    net: float | None = Field(default=None, ge=0)
    deductions: dict | None = None
    status: str | None = Field(default=None, pattern=r"^(draft|approved|paid)$")
    base_salary: Decimal | None = Field(default=None, ge=0)
    allowances: dict | None = None
    bhxh_employee: Decimal | None = Field(default=None, ge=0)
    bhxh_employer: Decimal | None = Field(default=None, ge=0)
    bhyt_employee: Decimal | None = Field(default=None, ge=0)
    bhyt_employer: Decimal | None = Field(default=None, ge=0)
    bhtn_employee: Decimal | None = Field(default=None, ge=0)
    bhtn_employer: Decimal | None = Field(default=None, ge=0)
    taxable_income: Decimal | None = Field(default=None, ge=0)
    personal_deduction: Decimal | None = Field(default=None, ge=0)
    dependent_deduction: Decimal | None = Field(default=None, ge=0)
    pit_amount: Decimal | None = Field(default=None, ge=0)
    working_days: int | None = None
    actual_working_days: int | None = None
    ot_pay: Decimal | None = Field(default=None, ge=0)
    dependents: int | None = Field(default=None, ge=0)


class PayrollRecordResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    period: str
    gross: float
    net: float
    deductions: dict | None
    status: str
    workspace_id: uuid.UUID
    base_salary: Decimal | None = None
    allowances: dict | None = None
    bhxh_employee: Decimal = Decimal("0")
    bhxh_employer: Decimal = Decimal("0")
    bhyt_employee: Decimal = Decimal("0")
    bhyt_employer: Decimal = Decimal("0")
    bhtn_employee: Decimal = Decimal("0")
    bhtn_employer: Decimal = Decimal("0")
    taxable_income: Decimal = Decimal("0")
    personal_deduction: Decimal = Decimal("11000000")
    dependent_deduction: Decimal = Decimal("0")
    pit_amount: Decimal = Decimal("0")
    working_days: int | None = None
    actual_working_days: int | None = None
    ot_pay: Decimal | None = None
    dependents: int = 0

    model_config = {"from_attributes": True}
