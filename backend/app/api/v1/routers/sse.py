import asyncio
import uuid
from typing import AsyncGenerator

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.services.notifications import subscribe

router = APIRouter(tags=["sse"])

HEARTBEAT_INTERVAL = 15  # seconds


async def _event_generator(workspace_id: uuid.UUID, user: User) -> AsyncGenerator[str, None]:
    q, unsubscribe = await subscribe(workspace_id)
    try:
        yield f"data: {{\"type\":\"connected\",\"workspace_id\":\"{workspace_id}\"}}\n\n"
        while True:
            try:
                payload = await asyncio.wait_for(q.get(), timeout=HEARTBEAT_INTERVAL)
                yield f"data: {payload}\n\n"
            except asyncio.TimeoutError:
                yield ": heartbeat\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        unsubscribe()


@router.get("/workspaces/{workspace_id}/sse")
async def sse_stream(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
):
    return StreamingResponse(
        _event_generator(workspace_id, current_user),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
