"""Valid status transitions and shared utilities for CRM entities."""


def escape_like(term: str) -> str:
    """Escape special ILIKE characters (%, _, \\) in user search input."""
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


LEAD_STATUS_TRANSITIONS: dict[str, list[str]] = {
    "new": ["contacted", "disqualified"],
    "contacted": ["qualified", "lost", "disqualified"],
    "qualified": ["opportunity", "lost", "disqualified"],
    "opportunity": [],  # terminal via deal conversion
    "lost": ["new"],  # allow re-open
    "disqualified": ["new"],  # allow re-open
}

DEAL_STAGE_TRANSITIONS: dict[str, list[str]] = {
    "lead": ["qualified", "closed_lost"],
    "qualified": ["needs_analysis", "proposal", "closed_lost"],
    "needs_analysis": ["proposal", "closed_lost"],
    "proposal": ["negotiation", "closed_lost"],
    "negotiation": ["closed_won", "closed_lost"],
    "closed_won": [],
    "closed_lost": [],
}

TICKET_STATUS_TRANSITIONS: dict[str, list[str]] = {
    "open": ["in_progress"],
    "in_progress": ["resolved", "open"],
    "resolved": ["closed", "open"],
    "closed": ["open"],  # allow reopen
}

CAMPAIGN_STATUS_TRANSITIONS: dict[str, list[str]] = {
    "draft": ["active"],
    "active": ["completed", "cancelled"],
    "completed": [],
    "cancelled": [],
}

ACTIVITY_OUTCOMES = ["completed", "pending", "cancelled"]


def validate_transition(
    transitions: dict[str, list[str]], current: str, target: str
) -> bool:
    """Check if a status/stage transition is valid."""
    allowed = transitions.get(current, [])
    return target in allowed
