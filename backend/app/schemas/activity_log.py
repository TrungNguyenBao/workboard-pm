import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, model_validator


class ActivityLogResponse(BaseModel):
    id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    action: str
    changes: dict | None
    actor_name: str
    actor_avatar_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def extract_actor(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return data
        d = {
            "id": data.id,
            "entity_type": data.entity_type,
            "entity_id": data.entity_id,
            "action": data.action,
            "changes": data.changes,
            "created_at": data.created_at,
            "actor_name": data.actor.name if data.actor else "Unknown",
            "actor_avatar_url": data.actor.avatar_url if data.actor else None,
        }
        return d
