from typing import Any

from app.agents.base import BaseAgent


class HRMAgent(BaseAgent):
    """Human Resource Management domain agent."""

    @property
    def module_name(self) -> str:
        return "hrm"

    async def handle_request(self, action: str, payload: dict[str, Any]) -> dict[str, Any]:
        return {"status": "not_implemented", "module": "hrm", "action": action}

    def get_capabilities(self) -> list[str]:
        return ["create_employee", "update_employee", "manage_leave", "run_payroll"]
