from typing import Any

from app.agents.base import BaseAgent


class PMSAgent(BaseAgent):
    """Project Management System domain agent."""

    @property
    def module_name(self) -> str:
        return "pms"

    async def handle_request(self, action: str, payload: dict[str, Any]) -> dict[str, Any]:
        return {"status": "not_implemented", "module": "pms", "action": action}

    def get_capabilities(self) -> list[str]:
        return ["create_task", "update_task", "assign_task", "create_project"]
