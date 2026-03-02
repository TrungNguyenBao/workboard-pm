from app.agents.base import BaseAgent

_agents: dict[str, BaseAgent] = {}


def register_agent(agent: BaseAgent) -> None:
    """Register a domain agent by its module name."""
    _agents[agent.module_name] = agent


def get_agent(module: str) -> BaseAgent | None:
    """Look up a registered agent by module name."""
    return _agents.get(module)


def list_agents() -> dict[str, list[str]]:
    """Return all registered agents and their capabilities."""
    return {name: agent.get_capabilities() for name, agent in _agents.items()}
