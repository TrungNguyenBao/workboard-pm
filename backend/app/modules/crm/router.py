from fastapi import APIRouter

from app.modules.crm.routers import (
    accounts, activities, analytics, campaigns, contacts, deals, leads, tickets, workflows,
)

crm_router = APIRouter(prefix="/crm", tags=["crm"])

# Workflows first — literal paths like /leads/stale must match before /leads/{lead_id}
crm_router.include_router(workflows.router)
crm_router.include_router(contacts.router)
crm_router.include_router(deals.router)
crm_router.include_router(leads.router)
crm_router.include_router(accounts.router)
crm_router.include_router(activities.router)
crm_router.include_router(campaigns.router)
crm_router.include_router(tickets.router)
crm_router.include_router(analytics.router)
