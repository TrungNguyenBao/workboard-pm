import uuid
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field


class MCPEnvelope(BaseModel):
    """Standard message envelope for inter-module communication."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # "request", "response", "event"
    source_module: str
    target_module: str
    action: str
    payload: dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    correlation_id: str | None = None
