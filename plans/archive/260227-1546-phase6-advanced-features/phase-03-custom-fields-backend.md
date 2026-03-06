# Phase 3: Custom Fields Backend

## Overview

- **Priority:** P1
- **Status:** complete
- **Effort:** 2 days
- **Depends on:** none

Add JSONB `custom_fields` column to tasks + `custom_field_definitions` table scoped to projects.
Field types: text, number, date, single_select, multi_select, checkbox, url.

## Architecture

- JSONB on tasks (not EAV) -- simplest, proven pattern
- `custom_field_definitions` table stores schema per project (name, type, options, position)
- Validation at app layer: service checks values against definitions before save
- Select options stored as JSONB array: `[{"id": "opt_1", "label": "High", "color": "#FF6B6B"}]`
- Soft-delete on definitions (preserve task data referencing deleted fields)

## Files to Create

| File | Purpose |
|------|---------|
| `backend/alembic/versions/0005_add_custom_fields.py` | Migration |
| `backend/app/models/custom_field.py` | CustomFieldDefinition model (~50 lines) |
| `backend/app/schemas/custom_field.py` | Create/Update/Response schemas (~60 lines) |
| `backend/app/services/custom_field.py` | CRUD + validation logic (~120 lines) |
| `backend/app/api/v1/routers/custom_fields.py` | 4 CRUD endpoints (~80 lines) |

## Files to Modify

| File | Change |
|------|--------|
| `backend/app/models/task.py` | Add `custom_fields` JSONB column |
| `backend/app/models/project.py` | Add `custom_field_definitions` relationship |
| `backend/app/models/__init__.py` | Import CustomFieldDefinition |
| `backend/app/schemas/task.py` | Add `custom_fields: dict | None` to Create/Update/Response |
| `backend/app/services/task.py` | Call `validate_custom_fields()` in create/update |
| `backend/app/api/v1/router.py` | Register custom_fields router |

## Implementation Steps

### 1. Migration (`0005_add_custom_fields.py`)

- Add JSONB `custom_fields` column to `tasks` table
- Create `custom_field_definitions` table with columns: id, project_id (FK CASCADE), name,
  field_type, required, description, options (JSONB), position, created_by_id (FK), timestamps, deleted_at
- Indexes: `ix_cfd_project_id`, `ix_cfd_project_position`

### 2. Model (`backend/app/models/custom_field.py`)

`CustomFieldDefinition(Base, TimestampMixin, SoftDeleteMixin)` with fields:
id, project_id (FK CASCADE), name (String 100), field_type (String 20),
required (bool), description (String 500 nullable), options (JSONB nullable),
position (float default 65536.0), created_by_id (FK users.id).
Relationship: `project` back_populates `custom_field_definitions`.

### 3. Update Task model (`backend/app/models/task.py`)

Add after `search_vector`:
```python
custom_fields: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
```

### 4. Update Project model (`backend/app/models/project.py`)

Add relationship:
```python
custom_field_definitions: Mapped[list["CustomFieldDefinition"]] = relationship(
    back_populates="project"
)
```

### 5. Schemas (`backend/app/schemas/custom_field.py`)

- `VALID_FIELD_TYPES = {"text", "number", "date", "single_select", "multi_select", "checkbox", "url"}`
- `SelectOption(BaseModel)`: id, label, color (default "#5E6AD2")
- `CustomFieldCreate`: name (1-100), field_type, required=False, description, options
- `CustomFieldUpdate`: name, required, description, options, position (all optional)
- `CustomFieldResponse`: all fields + `from_attributes=True`

### 6. Extend task schemas (`backend/app/schemas/task.py`)

Add to `TaskCreate` and `TaskUpdate`:
```python
custom_fields: dict[str, Any] | None = None
```

Add to `TaskResponse`:
```python
custom_fields: dict | None = None
```

Update `extract_from_orm` to include `custom_fields`.

### 7. Service (`backend/app/services/custom_field.py`)

Functions:
- `create_field(db, project_id, data, creator) -> CustomFieldDefinition`
- `list_fields(db, project_id) -> list[CustomFieldDefinition]`
- `update_field(db, field_id, data) -> CustomFieldDefinition`
- `delete_field(db, field_id)` -- soft delete
- `validate_custom_fields(db, project_id, values: dict) -> dict` -- type check each value against definition

Validation logic per type:
- `text`: must be str
- `number`: must be int or float
- `date`: must be ISO datetime string
- `single_select`: value must be in options[].id
- `multi_select`: each value must be in options[].id
- `checkbox`: must be bool
- `url`: must be str starting with http(s)://

### 8. Integrate validation in task service

In `backend/app/services/task.py`, in `create_task` and `update_task`:
```python
if data.custom_fields is not None:
    from app.services.custom_field import validate_custom_fields
    validated = await validate_custom_fields(db, project_id, data.custom_fields)
    # merge with existing custom_fields on update
```

### 9. Router (`backend/app/api/v1/routers/custom_fields.py`)

Prefix: `/projects/{project_id}/custom-fields`

Endpoints:
- `POST ""` -- create_field (editor role)
- `GET ""` -- list_fields (viewer role)
- `PATCH "/{field_id}"` -- update_field (editor role)
- `DELETE "/{field_id}"` -- delete_field (editor role)

### 10. Register router (`backend/app/api/v1/router.py`)

```python
from app.api.v1.routers import custom_fields
api_router.include_router(custom_fields.router)
```

## Todo

- [ ] Create migration 0005
- [ ] Create `models/custom_field.py`
- [ ] Add JSONB column to Task model
- [ ] Add relationship to Project model
- [ ] Update `models/__init__.py` import
- [ ] Create `schemas/custom_field.py`
- [ ] Extend task schemas with `custom_fields`
- [ ] Create `services/custom_field.py` with CRUD + validation
- [ ] Integrate validation in task create/update service
- [ ] Create `routers/custom_fields.py`
- [ ] Register router in `api/v1/router.py`
- [ ] Write unit tests for field validation logic

## Success Criteria

- CRUD endpoints for custom field definitions work with RBAC
- `PATCH /tasks/{id}` with `custom_fields: {"budget": 5000}` validates against definitions
- Invalid type (string for number field) returns 422
- Select field validates option IDs exist
- Soft-deleted definitions don't appear in list but task data preserved
