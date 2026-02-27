# Phase 2: Recurring Tasks Frontend

## Overview

- **Priority:** P1
- **Status:** complete
- **Effort:** 1.5 days
- **Depends on:** Phase 1

Recurrence picker in task detail drawer, recurring badge on task cards, spawned occurrence
list under parent template.

## Architecture

- New `recurrence-picker.tsx` component (~120 lines) using shadcn Radio + Select + DatePicker
- Modify `task-detail-drawer.tsx` to show picker + occurrence list section
- Modify `use-project-tasks.ts` to extend Task interface with recurrence fields
- Badge rendering in existing board/list views via conditional class

## Files to Create

| File | Purpose |
|------|---------|
| `frontend/src/features/tasks/components/recurrence-picker.tsx` | Radio group + cron input + end date |

## Files to Modify

| File | Change |
|------|--------|
| `frontend/src/features/projects/hooks/use-project-tasks.ts` | Add recurrence fields to Task interface |
| `frontend/src/features/tasks/components/task-detail-drawer.tsx` | Add recurrence picker section + occurrences list |

## Implementation Steps

### 1. Extend Task interface (`use-project-tasks.ts`)

Add to `Task` interface:
```typescript
recurrence_rule: string | null
recurrence_cron_expr: string | null
recurrence_end_date: string | null
parent_recurring_id: string | null
```

### 2. Create RecurrencePicker component

File: `frontend/src/features/tasks/components/recurrence-picker.tsx`

Props:
```typescript
interface RecurrencePickerProps {
  rule: string | null
  cronExpr: string | null
  endDate: string | null
  onChange: (data: { recurrence_rule: string | null; recurrence_cron_expr?: string | null; recurrence_end_date?: string | null }) => void
}
```

UI structure:
- Label "Repeat" with repeat icon
- Radio group: None / Daily / Weekly / Biweekly / Monthly / Custom CRON
- When "Custom CRON" selected: text input with placeholder `0 9 * * 1-5`
- Optional end date picker below radio group
- On change: call `onChange` with updated recurrence fields

Use shadcn `Select` component (already available) for dropdown variant.
Use native `<input type="date">` for end date (matching existing due_date pattern).

### 3. Integrate in task detail drawer

In `task-detail-drawer.tsx`, add between "Due date" MetaRow and "Description" section:

```tsx
{/* Recurrence */}
<MetaRow icon={<Repeat className="h-4 w-4" />} label="Repeat">
  <RecurrencePicker
    rule={task.recurrence_rule}
    cronExpr={task.recurrence_cron_expr}
    endDate={task.recurrence_end_date}
    onChange={(data) => updateTask.mutate(data)}
  />
</MetaRow>
```

Import `Repeat` from lucide-react.

### 4. Add recurring badge to task cards

In board/list views, detect `task.recurrence_rule` and show small badge:
```tsx
{task.recurrence_rule && (
  <span className="text-xs text-neutral-400" title={`Repeats ${task.recurrence_rule}`}>
    <Repeat className="h-3 w-3 inline" />
  </span>
)}
```

Add to: `board.tsx` task card, `list.tsx` task row (inline next to title).

### 5. Show occurrence list on parent template

In `task-detail-drawer.tsx`, when `task.recurrence_rule && !task.parent_recurring_id`:
- Query occurrences: `GET /projects/{id}/tasks?include_subtasks=true` filtered by `parent_recurring_id`
- Show collapsible "Occurrences" section listing recent spawned tasks with due dates
- Hide "Mark complete" button for template tasks

### 6. Hide completion on template tasks

In the drawer header, conditionally render the CheckSquare button:
```tsx
{!(task.recurrence_rule && !task.parent_recurring_id) && (
  <button onClick={...}>
    <CheckSquare ... />
  </button>
)}
```

## Todo

- [ ] Extend Task interface with recurrence fields
- [ ] Create `recurrence-picker.tsx` component
- [ ] Add RecurrencePicker to task detail drawer
- [ ] Add recurring badge to board + list views
- [ ] Show occurrences list on template tasks
- [ ] Hide completion button on template tasks
- [ ] Manual test: create recurring task, verify picker state

## Success Criteria

- User can set recurrence rule from task detail drawer
- Recurring tasks display repeat badge in board and list views
- Template tasks cannot be marked complete from UI
- Occurrences list shows spawned instances with correct dates
- Picker state persists after drawer close/reopen
