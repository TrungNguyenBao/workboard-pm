from fastapi import APIRouter

from app.modules.hrm.routers import (
    attendance_records,
    candidates,
    contracts,
    departments,
    employees,
    insurance_records,
    interviews,
    leave_requests,
    leave_types,
    offers,
    onboarding_checklists,
    payroll_records,
    positions,
    recruitment_requests,
    salary_history,
)

hrm_router = APIRouter(prefix="/hrm", tags=["hrm"])

hrm_router.include_router(departments.router)
hrm_router.include_router(employees.router)
hrm_router.include_router(leave_types.router)
hrm_router.include_router(leave_requests.router)
hrm_router.include_router(payroll_records.router)
hrm_router.include_router(positions.router)
hrm_router.include_router(contracts.router)
hrm_router.include_router(salary_history.router)
hrm_router.include_router(recruitment_requests.router)
hrm_router.include_router(candidates.router)
hrm_router.include_router(interviews.router)
hrm_router.include_router(offers.router)
hrm_router.include_router(onboarding_checklists.router)
hrm_router.include_router(attendance_records.router)
hrm_router.include_router(insurance_records.router)
