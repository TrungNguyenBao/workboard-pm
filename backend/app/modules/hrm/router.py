from fastapi import APIRouter

from app.modules.hrm.routers import departments, employees, leave_requests, leave_types, payroll_records

hrm_router = APIRouter(prefix="/hrm", tags=["hrm"])

hrm_router.include_router(departments.router)
hrm_router.include_router(employees.router)
hrm_router.include_router(leave_types.router)
hrm_router.include_router(leave_requests.router)
hrm_router.include_router(payroll_records.router)
