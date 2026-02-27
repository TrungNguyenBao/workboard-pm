from fastapi import APIRouter

from app.api.v1.routers import (
    activity,
    attachments,
    auth,
    comments,
    health,
    notifications,
    projects,
    sections,
    sse,
    tags,
    tasks,
    teams,
    workspaces,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(activity.router)
api_router.include_router(workspaces.router)
api_router.include_router(teams.router)
api_router.include_router(projects.router)
api_router.include_router(sections.router)
api_router.include_router(tasks.router)
api_router.include_router(comments.router)
api_router.include_router(attachments.router)
api_router.include_router(tags.router)
api_router.include_router(notifications.router)
api_router.include_router(sse.router)
