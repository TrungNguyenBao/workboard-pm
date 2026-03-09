import logging
import uuid
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.contract import Contract
from app.modules.hrm.models.payroll_record import PayrollRecord
from app.modules.hrm.schemas.payroll_record import PayrollRecordCreate, PayrollRecordUpdate
from app.modules.hrm.services.attendance_record import get_monthly_summary
from app.modules.hrm.services.status_transitions import validate_transition
from app.modules.hrm.services.vn_tax import calculate_net_salary, calculate_ot_pay

log = logging.getLogger(__name__)

PAYROLL_TRANSITIONS: dict[str, list[str]] = {
    "draft": ["reviewed"],
    "reviewed": ["approved"],
    "approved": ["paid"],
    "paid": [],
}


async def _get_active_contract(
    db: AsyncSession, employee_id: uuid.UUID, workspace_id: uuid.UUID
) -> Contract | None:
    result = await db.scalars(
        select(Contract).where(
            Contract.employee_id == employee_id,
            Contract.workspace_id == workspace_id,
            Contract.status == "active",
        )
    )
    return result.first()


async def create_payroll_record(
    db: AsyncSession, workspace_id: uuid.UUID, data: PayrollRecordCreate
) -> PayrollRecord:
    fields = data.model_dump()

    # Auto-calculate from contract + attendance if base_salary not provided
    if fields.get("base_salary") is None:
        try:
            contract = await _get_active_contract(db, data.employee_id, workspace_id)
            if contract:
                base = float(contract.base_salary)
                dependents = fields.get("dependents") or 0
                working_days = fields.get("working_days") or 22

                # Get OT hours from attendance for the period
                ot_hours = 0.0
                try:
                    summaries = await get_monthly_summary(db, workspace_id, data.period)
                    emp_summary = next(
                        (s for s in summaries if s.employee_id == data.employee_id), None
                    )
                    if emp_summary:
                        ot_hours = float(emp_summary.overtime_hours)
                        actual_days = emp_summary.present_days + emp_summary.late_days
                        fields["actual_working_days"] = actual_days
                except Exception:
                    pass

                ot_pay = calculate_ot_pay(base, working_days, ot_weekday_hours=ot_hours)
                gross = base + ot_pay + (float(contract.allowances.get("total", 0)) if contract.allowances else 0)
                breakdown = calculate_net_salary(base, dependents)

                fields.update(
                    base_salary=Decimal(str(base)),
                    gross=gross,
                    net=breakdown["net"],
                    ot_pay=Decimal(str(ot_pay)),
                    dependents=dependents,
                    bhxh_employee=Decimal(str(breakdown["bhxh_employee"])),
                    bhyt_employee=Decimal(str(breakdown["bhyt_employee"])),
                    bhtn_employee=Decimal(str(breakdown["bhtn_employee"])),
                    taxable_income=Decimal(str(breakdown["taxable_income"])),
                    personal_deduction=Decimal(str(breakdown["personal_deduction"])),
                    dependent_deduction=Decimal(str(breakdown["dependent_deduction"])),
                    pit_amount=Decimal(str(breakdown["pit_amount"])),
                )
        except Exception as exc:
            log.warning("Payroll auto-calc failed, falling back to manual: %s", exc)

    pr = PayrollRecord(workspace_id=workspace_id, **fields)
    db.add(pr)
    await db.commit()
    await db.refresh(pr)
    return pr


async def list_payroll_records(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = None,
    period: str | None = None,
    payroll_status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[PayrollRecord], int]:
    q = select(PayrollRecord).where(PayrollRecord.workspace_id == workspace_id)
    count_q = select(func.count(PayrollRecord.id)).where(PayrollRecord.workspace_id == workspace_id)

    if employee_id:
        q = q.where(PayrollRecord.employee_id == employee_id)
        count_q = count_q.where(PayrollRecord.employee_id == employee_id)

    if period:
        q = q.where(PayrollRecord.period == period)
        count_q = count_q.where(PayrollRecord.period == period)

    if payroll_status:
        q = q.where(PayrollRecord.status == payroll_status)
        count_q = count_q.where(PayrollRecord.status == payroll_status)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(PayrollRecord.period.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_payroll_record(
    db: AsyncSession, payroll_record_id: uuid.UUID, workspace_id: uuid.UUID
) -> PayrollRecord:
    result = await db.scalars(
        select(PayrollRecord).where(
            PayrollRecord.id == payroll_record_id, PayrollRecord.workspace_id == workspace_id
        )
    )
    pr = result.first()
    if not pr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payroll record not found")
    return pr


async def update_payroll_record(
    db: AsyncSession, payroll_record_id: uuid.UUID, workspace_id: uuid.UUID, data: PayrollRecordUpdate
) -> PayrollRecord:
    pr = await get_payroll_record(db, payroll_record_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(pr, field, value)
    await db.commit()
    await db.refresh(pr)
    return pr


async def delete_payroll_record(
    db: AsyncSession, payroll_record_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    pr = await get_payroll_record(db, payroll_record_id, workspace_id)
    await db.delete(pr)
    await db.commit()


async def review_payroll(
    db: AsyncSession, payroll_record_id: uuid.UUID, workspace_id: uuid.UUID, reviewer_id: uuid.UUID
) -> PayrollRecord:
    pr = await get_payroll_record(db, payroll_record_id, workspace_id)
    validate_transition(pr.status, "reviewed", PAYROLL_TRANSITIONS, "PayrollRecord")
    pr.status = "reviewed"
    await db.commit()
    await db.refresh(pr)
    return pr


async def approve_payroll(
    db: AsyncSession, payroll_record_id: uuid.UUID, workspace_id: uuid.UUID, approver_id: uuid.UUID
) -> PayrollRecord:
    pr = await get_payroll_record(db, payroll_record_id, workspace_id)
    validate_transition(pr.status, "approved", PAYROLL_TRANSITIONS, "PayrollRecord")
    pr.status = "approved"
    await db.commit()
    await db.refresh(pr)
    return pr
