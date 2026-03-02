from fastapi import APIRouter

from app.modules.pms.routers import (
    activity,
    attachments,
    comments,
    custom_fields,
    goals,
    projects,
    sections,
    tags,
    tasks,
)

pms_router = APIRouter(prefix="/pms", tags=["pms"])

pms_router.include_router(projects.router)
pms_router.include_router(sections.router)
pms_router.include_router(tasks.router)
pms_router.include_router(custom_fields.router)
pms_router.include_router(goals.router)
pms_router.include_router(comments.router)
pms_router.include_router(attachments.router)
pms_router.include_router(tags.router)
pms_router.include_router(activity.router)
