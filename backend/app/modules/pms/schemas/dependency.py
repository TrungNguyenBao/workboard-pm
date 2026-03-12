import uuid

from pydantic import BaseModel


class DependencyCreate(BaseModel):
    blocking_task_id: uuid.UUID
    dependency_type: str = "blocks"


class DependencyResponse(BaseModel):
    id: uuid.UUID
    blocking_task_id: uuid.UUID
    blocked_task_id: uuid.UUID
    dependency_type: str
    blocking_task_title: str
    blocked_task_title: str

    model_config = {"from_attributes": True}
