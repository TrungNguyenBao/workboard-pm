import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, Field

from app.mcp.protocol import MCPEnvelope


class AuditEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    envelope_id: str
    source_module: str
    target_module: str
    action: str
    allowed: bool
    reason: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# In-memory audit log (persist to DB in production)
_audit_log: list[AuditEntry] = []

# Default allowed module communication pairs
_allowed_routes: set[tuple[str, str]] = {
    ("pms", "wms"), ("pms", "hrm"), ("pms", "crm"),
    ("wms", "pms"), ("hrm", "pms"), ("crm", "pms"),
    ("wms", "hrm"), ("hrm", "wms"),
}


def check_policy(envelope: MCPEnvelope) -> bool:
    """Check if a message is allowed by governance policy."""
    route = (envelope.source_module, envelope.target_module)
    allowed = route in _allowed_routes
    _audit_log.append(AuditEntry(
        envelope_id=envelope.id,
        source_module=envelope.source_module,
        target_module=envelope.target_module,
        action=envelope.action,
        allowed=allowed,
        reason=None if allowed else "Route not in allowed pairs",
    ))
    return allowed


def get_audit_log(limit: int = 50) -> list[AuditEntry]:
    """Return the most recent audit entries."""
    return _audit_log[-limit:]
