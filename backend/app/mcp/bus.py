from typing import Any, Callable, Coroutine

from app.mcp.protocol import MCPEnvelope

# In-process event bus (Redis pub/sub integration deferred)
_handlers: dict[str, list[Callable[[MCPEnvelope], Coroutine[Any, Any, None]]]] = {}


async def publish(envelope: MCPEnvelope) -> None:
    """Publish a message to the event bus."""
    handlers = _handlers.get(envelope.target_module, [])
    for handler in handlers:
        await handler(envelope)


def subscribe(
    module: str,
    handler: Callable[[MCPEnvelope], Coroutine[Any, Any, None]],
) -> None:
    """Subscribe a handler for messages targeting a specific module."""
    _handlers.setdefault(module, []).append(handler)


def unsubscribe(
    module: str,
    handler: Callable[[MCPEnvelope], Coroutine[Any, Any, None]],
) -> None:
    """Remove a handler subscription."""
    if module in _handlers:
        _handlers[module] = [h for h in _handlers[module] if h is not handler]
