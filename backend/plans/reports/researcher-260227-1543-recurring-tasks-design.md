# Recurring Tasks Feature Design Research

**Date:** 2026-02-27 | **Status:** Complete

## Executive Summary

Recurring tasks require minimal viable design. **Recommendation: Enum-based recurrence + background job generation** (not RFC 5545 RRULE—too complex for YAGNI phase).

---

## 1. Data Model: Enum vs RRULE

### Option A: Simple Enum (RECOMMENDED)
**Schema addition to `tasks` table:**
```
recurrence_rule: String | NULL  (values: "daily", "weekly", "biweekly", "monthly", "custom_cron")
recurrence_end_date: DateTime | NULL
recurrence_start_date: DateTime | NULL (when first occurrence spawned)
parent_recurring_id: UUID | NULL (FK to original recurring task)
```

**Advantages:**
- 6 additional columns, minimal migration friction
- Query-friendly: `WHERE recurrence_rule IS NOT NULL`
- UI picker trivial: 4 radio buttons + optional cron input
- Easy to extend: add "custom_cron" for power users later

**Disadvantages:**
- Can't encode complex patterns (e.g., "2nd Tuesday of month")
- Custom CRON requires external library (e.g., `croniter`)

### Option B: RFC 5545 RRULE String
**Example:** `"FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=20"`

**Advantages:**
- Industry standard, future-proof for APIs (CalDAV, iCal export)
- Powerful: encodes any pattern

**Disadvantages:**
- Overkill for MVP (50+ syntax variations)
- Parsing requires `rrule` library (PyPI: `python-dateutil`)
- UI complexity jumps 10x (recurring pattern builder is hard)
- **VIOLATES YAGNI**: 80% unused complexity for mid-size companies

### Decision
**Use Enum with optional CRON field.** Defer RFC 5545 to v2+ when CalDAV export needed.

---

## 2. Task Generation Strategy

### Option A: Background Job (RECOMMENDED)
**When:** ARQ cron job runs nightly (e.g., 2 AM UTC)

**Logic:**
```
FOR each task WHERE recurrence_rule IS NOT NULL AND last_occurrence < today:
  1. Calculate next due_date via pattern (daily=+1d, weekly=+7d, etc.)
  2. If next_due > recurrence_end_date: mark task inactive
  3. Else: spawn new Task(parent_recurring_id=original_id, ...)
  4. Update original.last_generated_date = now()
```

**Advantages:**
- Scales to 10K+ recurring tasks (one batch job)
- Deterministic: same result if job re-runs
- Pairs with existing `send_due_reminders` job (already in worker/tasks.py)
- No user wait time

**Disadvantages:**
- 1-day lag for newly-created recurring tasks to generate next occurrence
- Needs careful handling of time zones (store next_due in user's TZ)

### Option B: On-Demand (User Completes Task)
**When:** User marks parent task "completed"

**Logic:**
```
IF task.recurrence_rule:
  Spawn next_task(due_date = task.due_date + interval)
  Mark current task as "completed"
```

**Advantages:**
- Instant feedback to user
- Minimal DB load

**Disadvantages:**
- Breaks if user marks via bulk API (unlinked worker)
- UX confusion: completing "parent" spawns "next"—differs from Asana/Linear
- Doesn't handle "open 10 instances at once for a vacation task"

### Decision
**Use Background Job.** It's the Asana/Linear pattern. Supplement with on-demand for edge cases if UX testing shows lag is visible.

---

## 3. Completion Behavior

### Pattern (Asana/Linear/Notion):
1. **Recurring task "parent" never completes** — it's a template
2. **Spawned occurrences complete independently**
3. User can complete/reopen individual occurrences without affecting parent

### Implementation:
```python
# In TaskUpdate service:
if task.parent_recurring_id:
    # This is a spawned occurrence
    task.status = "completed"  # OK
else:
    if task.recurrence_rule:
        # This is the parent recurring task
        raise HTTPException("Cannot complete recurring parent. Only occurrences can be marked done.")
```

**UI Implication:** Hide the "Mark Done" button on recurring parent task. Show children in expandable list.

---

## 4. UI: Recurrence Picker Component

### Minimal Component (`recurrence-picker.tsx`)
```jsx
<RadioGroup defaultValue="none">
  <Radio value="none">No repeat</Radio>
  <Radio value="daily">Daily</Radio>
  <Radio value="weekly">Weekly</Radio>
  <Radio value="monthly">Monthly</Radio>
  <Radio value="custom">Custom CRON</Radio>
  {selectedValue === "custom" && (
    <Input placeholder="0 9 * * 1-5" title="CRON format" />
  )}
</RadioGroup>

<DatePicker label="Recurrence ends" nullable />
```

**Size:** ~150 lines (Radix + shadcn).

### Inspiration:
- **Asana:** Radio buttons, dropdown for day-of-week, end date
- **Linear:** Inline dropdown (compact)
- **Notion:** Card-based with preview ("Repeats daily")

**Recommendation:** Follow Asana pattern (most familiar to users).

---

## 5. Required API Changes

### New Fields in TaskCreate/TaskUpdate:
```python
class TaskCreate(BaseModel):
    recurrence_rule: str | None = None  # "daily", "weekly", "monthly", or CRON
    recurrence_end_date: datetime | None = None
```

### New Task Response Field:
```python
class TaskResponse(BaseModel):
    parent_recurring_id: uuid.UUID | None = None
    recurrence_rule: str | None = None
    recurrence_end_date: datetime | None = None
```

### New Endpoint (Optional, for v1.1):
```
GET /projects/{project_id}/tasks/{task_id}/recurrences
Response: list of spawned occurrences + parent metadata
```

---

## 6. Database Migration Path

### Alembic Migration (0004_add_recurring_tasks.py):
```sql
ALTER TABLE tasks ADD COLUMN recurrence_rule VARCHAR(50);
ALTER TABLE tasks ADD COLUMN recurrence_end_date TIMESTAMP WITH TIMEZONE;
ALTER TABLE tasks ADD COLUMN recurrence_start_date TIMESTAMP WITH TIMEZONE;
ALTER TABLE tasks ADD COLUMN parent_recurring_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN last_generated_date TIMESTAMP WITH TIMEZONE;

CREATE INDEX ix_tasks_recurrence_rule ON tasks(recurrence_rule) WHERE recurrence_rule IS NOT NULL;
CREATE INDEX ix_tasks_parent_recurring_id ON tasks(parent_recurring_id);
```

---

## 7. Worker Job (ARQ Extension)

Add to `backend/app/worker/tasks.py`:

```python
async def spawn_recurring_tasks(ctx: dict) -> int:
    """Job: spawn next occurrences for recurring tasks."""
    from datetime import datetime, timedelta, timezone

    # Patterns
    intervals = {
        "daily": timedelta(days=1),
        "weekly": timedelta(days=7),
        "biweekly": timedelta(days=14),
        "monthly": timedelta(days=30),  # Approximation; improve later
    }

    async with AsyncSessionLocal() as db:
        # Find all recurring tasks due for next spawn
        tasks = await db.scalars(
            select(Task).where(
                Task.recurrence_rule.in_(intervals.keys()),
                Task.deleted_at.is_(None),
                (Task.last_generated_date.is_(None)) |
                (Task.last_generated_date < datetime.now(timezone.utc))
            )
        )
        count = 0
        for task in tasks.all():
            if task.recurrence_end_date and task.due_date >= task.recurrence_end_date:
                continue  # Recurrence ended

            # Calculate next due date
            delta = intervals[task.recurrence_rule]
            next_due = task.due_date + delta if task.due_date else datetime.now(timezone.utc) + delta

            # Spawn new occurrence
            new_task = Task(
                project_id=task.project_id,
                section_id=task.section_id,
                assignee_id=task.assignee_id,
                created_by_id=task.created_by_id,
                title=task.title,
                description=task.description,
                due_date=next_due,
                start_date=task.start_date,
                priority=task.priority,
                parent_recurring_id=task.id,
            )
            db.add(new_task)
            task.last_generated_date = datetime.now(timezone.utc)
            count += 1

        await db.commit()
    return count
```

---

## 8. Implementation Checklist (YAGNI MVP)

**Phase 1: Backend (2-3 days)**
- [ ] Migration: Add 5 columns to tasks table
- [ ] Model: Add fields to Task ORM
- [ ] Schema: Extend TaskCreate/TaskUpdate
- [ ] Service: Add spawn logic to task service
- [ ] Worker: Add `spawn_recurring_tasks` cron job (nightly)
- [ ] Tests: Unit test recurrence date calculation + spawn logic

**Phase 2: API (1 day)**
- [ ] Endpoint: PATCH task with recurrence fields
- [ ] Response: Include recurrence metadata
- [ ] Validation: Reject "custom_cron" if croniter not available

**Phase 3: Frontend (2-3 days)**
- [ ] Component: `recurrence-picker.tsx` (shadcn Radio + DatePicker)
- [ ] Hook: Use in task creation/editing modal
- [ ] Display: Show "Repeats daily/weekly/..." badge on recurring tasks
- [ ] Expandable: Show recent occurrences under parent task

**Phase 4: Refinement (1 day)**
- [ ] E2E tests: Create recurring task → verify next occurrence spawned
- [ ] Timezone edge cases: Ensure due_date calculations respect user TZ
- [ ] Documentation: Update API docs, add example cURL requests

---

## Unresolved Questions

1. **Timezone handling:** Should recurrence dates shift to user's local time or stay UTC?
   - *Recommendation:* Store user's TZ in workspace settings; calculate next_due in that TZ.

2. **What happens if user re-orders section?** Do spawned occurrences appear after parent or sorted by due_date?
   - *Recommendation:* Sort by position (like any other task); parent can go anywhere.

3. **Do we need a "Mark all as done" button for recurring occurrences?**
   - *Deferral:* v1.1 (bulk actions likely needed for other features too).

4. **CRON validation:** Accept any croniter-valid expression or restrict to 6-char cron?
   - *Recommendation:* Support full croniter syntax; surface errors in UI.

---

## References

- **Existing ARQ setup:** `backend/app/worker/tasks.py` — pattern replicates `send_due_reminders`
- **Task model:** `backend/app/models/task.py` — 13 existing columns, soft-delete via `TimestampMixin`
- **API pattern:** `backend/app/api/v1/routers/tasks.py` — RBAC + async service layer established
- **Schema validation:** `backend/app/schemas/task.py` — Pydantic v2, date validators already exist

---

**Recommendation Summary:** Implement Enum-based recurrence (daily/weekly/monthly + CRON) with background job generation. Defer RFC 5545 to v2 when CalDAV export needed. MVP scope: ~4 days across backend, API, frontend, testing.
