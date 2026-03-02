from fastapi import APIRouter

from app.modules.crm.routers import contacts, deals

crm_router = APIRouter(prefix="/crm", tags=["crm"])

crm_router.include_router(contacts.router)
crm_router.include_router(deals.router)
