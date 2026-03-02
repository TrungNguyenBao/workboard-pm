from abc import ABC, abstractmethod
from typing import Any


class BaseAgent(ABC):
    """Base class for all domain agents."""

    @property
    @abstractmethod
    def module_name(self) -> str:
        """Return the module this agent serves (e.g., 'pms', 'wms')."""
        ...

    @abstractmethod
    async def handle_request(self, action: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Handle an incoming agent request."""
        ...

    @abstractmethod
    def get_capabilities(self) -> list[str]:
        """Return list of actions this agent can perform."""
        ...
