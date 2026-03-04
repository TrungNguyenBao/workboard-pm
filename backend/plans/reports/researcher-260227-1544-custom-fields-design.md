# Custom Fields Feature Design Research

**Date:** 2026-02-27 | **Author:** Researcher Agent

---

## Executive Summary

Recommend **PostgreSQL JSONB for custom field values** + lightweight schema table. This approach honors YAGNI (defer EAV complexity), works with existing SQLAlchemy patterns, and supports real-time collaboration via SSE. Trade-off: weaker query filtering on custom fields (accept for MVP, optimize later with computed columns if needed).

---

## 1. Data Model Comparison

### Option A: JSONB Column (Recommended)
Store all custom field values in a single `custom_fields: JSONB` column on `Task`.

**Pros:**
- Minimal schema changes; zero migrations per field type
- Native PostgreSQL indexing via `GIN` or expression indexes
- Flexible field additions without ALTER TABLE
- Simple serialization to/from Pydantic models
- Aligns with existing pattern (`ActivityLog.changes` uses JSONB)

**Cons:**
- Weaker type safety at DB level (validation moves to app layer)
- Complex filtering on custom fields (workaround: computed columns or function-based indexes)

### Option B: EAV (Entity-Attribute-Value)
Separate `custom_field_definitions` + `custom_field_values` tables.

**Pros:**
- Strong SQL filtering/grouping
- Normalized schema

**Cons:**
- **Violates YAGNI:** adds 2+ tables, joins, and migration overhead
- Slower queries (N+1 problem); complex to eager-load
- Overkill for MVP; Asana itself likely uses JSONB for simplicity

### Option C: Typed Tables
Separate table per field type (e.g., `custom_text_fields`, `custom_date_fields`).

**Cons:**
- Requires UNION queries; even less maintainable than EAV
- Added migration complexity per type

**Winner:** **JSONB** — simplest, fastest to implement, proven at scale (Shopify, GitHub use this pattern).

---

## 2. Schema Design

### Task Model Addition
```python
custom_fields: Mapped[dict[str, Any] | None] = mapped_column(
    JSONB, nullable=True, default=dict
)
```

### New Table: CustomFieldDefinition
```python
class CustomFieldDefinition(Base, TimestampMixin):
    __tablename__ = "custom_field_definitions"

    id: Mapped[uuid.UUID] = ...
    project_id: Mapped[uuid.UUID] = ForeignKey("projects.id")
    name: Mapped[str]  # "Budget", "Client"
    field_type: Mapped[str]  # "text" | "number" | "date" | "select" | "multi_select" | "checkbox" | "url"
    required: Mapped[bool] = False
    description: Mapped[str | None] = None

    # For select/multi_select: JSON array of option objects
    options: Mapped[list[dict] | None] = mapped_column(JSONB, nullable=True)
    # {"id": "opt_1", "label": "High", "color": "#FF6B6B"}

    position: Mapped[float]  # for reordering in UI
    created_by_id: Mapped[uuid.UUID] = ForeignKey("users.id")

    project: Mapped["Project"] = relationship(back_populates="custom_field_definitions")
```

### Sample Task.custom_fields Payload
```json
{
  "budget": 5000,
  "client": "Acme Corp",
  "status_internal": "review",
  "tags_custom": ["urgent", "client-facing"],
  "launch_date": "2026-03-15T00:00:00Z",
  "is_billable": true
}
```

---

## 3. API Surface

### Field Definitions CRUD
```
POST   /projects/{project_id}/custom-fields
GET    /projects/{project_id}/custom-fields
PATCH  /projects/{project_id}/custom-fields/{field_id}
DELETE /projects/{project_id}/custom-fields/{field_id}
```

### Task Field Values
Custom fields embedded in task update payload:
```
PATCH /projects/{project_id}/tasks/{task_id}
{
  "title": "...",
  "custom_fields": {
    "budget": 5000,
    "client": "Acme"
  }
}
```

### Schemas (Pydantic)
```python
class CustomFieldDefinitionCreate(BaseModel):
    name: str
    field_type: Literal["text", "number", "date", "select", "multi_select", "checkbox", "url"]
    required: bool = False
    description: str | None = None
    options: list[{"label": str, "color": str}] | None = None

class CustomFieldDefinitionResponse(CustomFieldDefinitionCreate):
    id: uuid.UUID
    position: float
    created_by_id: uuid.UUID
    created_at: datetime
    model_config = {"from_attributes": True}
```

Extend `TaskUpdate`:
```python
class TaskUpdate(BaseModel):
    # ... existing fields
    custom_fields: dict[str, Any] | None = None
```

---

## 4. Backend Logic

### Service: task.py
- Validate custom field values against definitions (type coercion, required check, enum validation)
- On create/update: `await validate_custom_fields(db, project_id, custom_fields_payload)`
- SSE event: publish `"task.custom_fields_updated"` when any custom field changes

### Migration (alembic)
Add to `tasks` table:
```python
op.add_column("tasks", sa.Column("custom_fields", postgresql.JSONB(), nullable=True))
```

Create new table + indexes for field definitions.

---

## 5. UI Patterns

### Field Config Panel (Admin)
Location: Project settings → Custom Fields tab
- List all fields with type badge, required indicator
- Inline edit name/description; drag-to-reorder
- Delete with soft confirmation (warn: "X tasks use this field")
- Add button → modal for name + type selection

### Inline Editing (Task Detail)
- Custom fields section below standard fields in task detail drawer
- Group by field type (text/numbers, dates, selects, checkboxes)
- Respect TanStack Query refetch: on blur, PATCH task with only `custom_fields` delta
- Show field definition tooltip (description) on hover

### Empty State
If no custom fields defined: "No custom fields yet. [Add in project settings]"

### Select/Multi-Select Rendering
Render as shadcn `Select` or `MultiSelect` component; populate options from definition.

---

## 6. Implementation Sequence

1. **Migration:** add `custom_fields` JSONB column to tasks + create field definitions table
2. **Models:** add CustomFieldDefinition; extend Task.custom_fields
3. **Schemas:** extend TaskCreate/TaskUpdate with `custom_fields` dict
4. **Service:** add validation logic; update create/update_task to handle custom fields
5. **Router:** POST/PATCH custom field definitions; update tasks router to accept custom_fields
6. **Frontend:** custom fields form component + field config panel + SSE listener for field changes
7. **Tests:** unit test validation; E2E test create task with custom fields

---

## 7. Unresolved Questions

- **Filtering/Sorting:** Should MVP support filtering tasks by custom field value? (Defer to Phase 2; use SQL function indexes if needed)
- **Migration strategy:** How to handle custom field deletions? Soft-delete or cascade? (Recommend soft-delete to preserve data)
- **Bulk operations:** Update custom fields on multiple tasks at once? (Defer to Phase 2)

---

## Key Trade-offs

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| **Storage** | JSONB | Simplicity over normalization; MVP-friendly |
| **Type safety** | App-layer validation | PostgreSQL JSONB lacks strong typing; accept trade-off |
| **Indexing** | Expression indexes (Phase 2) | Defer complex filtering to Phase 2 |
| **Field removal** | Soft-delete | Preserves audit trail; prevents data loss |

