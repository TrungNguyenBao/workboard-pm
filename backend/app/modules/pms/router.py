from fastapi import APIRouter

from app.modules.pms.routers import (
    activity,
    attachments,
    comments,
    custom_fields,
    dashboard,
    dependencies,
    followers,
    goals,
    members,
    projects,
    sections,
    sprints,
    tags,
    tasks,
)

pms_router = APIRouter(prefix="/pms", tags=["pms"])

pms_router.include_router(dashboard.router)
pms_router.include_router(projects.router)
pms_router.include_router(members.router)
pms_router.include_router(sections.router)
pms_router.include_router(tasks.router)
pms_router.include_router(custom_fields.router)
pms_router.include_router(goals.router)
pms_router.include_router(comments.router)
pms_router.include_router(attachments.router)
pms_router.include_router(tags.router)
pms_router.include_router(activity.router)
pms_router.include_router(sprints.router)
pms_router.include_router(dependencies.router)
pms_router.include_router(followers.router)
