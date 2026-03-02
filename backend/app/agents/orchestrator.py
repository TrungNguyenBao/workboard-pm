from typing import Any

from app.agents.registry import get_agent, list_agents


class AgentOrchestrator:
    """Routes requests to the appropriate domain agent."""

    async def invoke(self, module: str, action: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Dispatch an action to the named module's agent."""
        agent = get_agent(module)
        if not agent:
            return {"error": f"No agent registered for module '{module}'"}
        return await agent.handle_request(action, payload)

    def list_capabilities(self) -> dict[str, list[str]]:
        """Return all registered agents and their supported actions."""
        return list_agents()


orchestrator = AgentOrchestrator()
