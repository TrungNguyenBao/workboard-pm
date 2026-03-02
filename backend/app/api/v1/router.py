from fastapi import APIRouter

from app.api.v1.routers import (
    agents,
    auth,
    health,
    notifications,
    sse,
    teams,
    workspaces,
)
from app.modules.crm.router import crm_router
from app.modules.hrm.router import hrm_router
from app.modules.pms.router import pms_router
from app.modules.wms.router import wms_router

api_router = APIRouter()

# Shared routers
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(workspaces.router)
api_router.include_router(teams.router)
api_router.include_router(notifications.router)
api_router.include_router(sse.router)

# Agent router
api_router.include_router(agents.router)

# Module routers
api_router.include_router(pms_router)
api_router.include_router(wms_router)
api_router.include_router(hrm_router)
api_router.include_router(crm_router)
