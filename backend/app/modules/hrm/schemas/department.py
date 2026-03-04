import uuid

from pydantic import BaseModel, Field


class DepartmentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=500)
    parent_department_id: uuid.UUID | None = None
    manager_id: uuid.UUID | None = None


class DepartmentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    parent_department_id: uuid.UUID | None = None
    manager_id: uuid.UUID | None = None


class DepartmentResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    workspace_id: uuid.UUID
    parent_department_id: uuid.UUID | None = None
    manager_id: uuid.UUID | None = None

    model_config = {"from_attributes": True}


class DepartmentTreeNode(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    parent_department_id: uuid.UUID | None = None
    manager_id: uuid.UUID | None = None
    manager_name: str | None = None
    children: list["DepartmentTreeNode"] = []
    employee_count: int = 0


DepartmentTreeNode.model_rebuild()
