from fastapi import HTTPException, status


def validate_transition(
    current: str,
    target: str,
    transitions: dict[str, list[str]],
    entity: str = "entity",
) -> None:
    """Raise HTTP 400 if the status transition is not allowed."""
    allowed = transitions.get(current, [])
    if target not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"{entity}: cannot transition from '{current}' to '{target}'. "
                f"Allowed: {allowed}"
            ),
        )
