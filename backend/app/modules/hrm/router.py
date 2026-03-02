from fastapi import APIRouter

from app.modules.hrm.routers import departments, employees

hrm_router = APIRouter(prefix="/hrm", tags=["hrm"])

hrm_router.include_router(departments.router)
hrm_router.include_router(employees.router)
