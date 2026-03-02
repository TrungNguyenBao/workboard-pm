from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.agents.orchestrator import orchestrator
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/agents", tags=["agents"])


class AgentRequest(BaseModel):
    action: str
    payload: dict[str, Any] = {}


@router.post("/{module}/invoke")
async def invoke_agent(
    module: str,
    request: AgentRequest,
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Invoke an action on the specified domain agent."""
    return await orchestrator.invoke(module, request.action, request.payload)


@router.get("/capabilities")
async def list_capabilities(
    current_user: User = Depends(get_current_user),
) -> dict[str, list[str]]:
    """List all registered agents and their supported actions."""
    return orchestrator.list_capabilities()
