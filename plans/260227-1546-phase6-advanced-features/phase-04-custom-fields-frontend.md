# Phase 4: Custom Fields Frontend

## Overview

- **Priority:** P1
- **Status:** complete
- **Effort:** 2 days
- **Depends on:** Phase 3

Field config panel in project settings + inline custom field editing in task detail drawer.

## Architecture

- New feature folder: `frontend/src/features/custom-fields/`
- Config panel as a tab/section in existing `ProjectSettingsDialog`
- Inline renderers in task detail drawer below standard fields
- Each field type has a renderer component (text input, number input, date, select, checkbox, URL)
- TanStack Query hooks for definitions CRUD + task custom_fields mutation

## Files to Create

| File | Purpose |
|------|---------|
| `frontend/src/features/custom-fields/hooks/use-custom-fields.ts` | Query/mutation hooks |
| `frontend/src/features/custom-fields/components/field-config-panel.tsx` | List/add/edit/delete definitions |
| `frontend/src/features/custom-fields/components/custom-field-renderer.tsx` | Render correct input per type |
| `frontend/src/features/custom-fields/components/custom-fields-section.tsx` | Section in task drawer |
| `frontend/src/features/custom-fields/components/add-field-dialog.tsx` | Dialog for creating new field |

## Files to Modify

| File | Change |
|------|--------|
| `frontend/src/features/projects/hooks/use-project-tasks.ts` | Add `custom_fields` to Task interface |
| `frontend/src/features/tasks/components/task-detail-drawer.tsx` | Add CustomFieldsSection |
| `frontend/src/features/projects/components/project-settings-dialog.tsx` | Add "Custom Fields" tab |

## Implementation Steps

### 1. Hooks (`use-custom-fields.ts`)

```typescript
interface CustomFieldDefinition {
  id: string; project_id: string; name: string; field_type: string
  required: boolean; description: string | null
  options: { id: string; label: string; color: string }[] | null
  position: number; created_by_id: string; created_at: string
}

export function useCustomFields(projectId: string) {
  return useQuery<CustomFieldDefinition[]>({
    queryKey: ['custom-fields', projectId],
    queryFn: () => api.get(`/projects/${projectId}/custom-fields`).then(r => r.data),
    enabled: !!projectId,
  })
}

export function useCreateCustomField(projectId: string) { ... }
export function useUpdateCustomField(projectId: string) { ... }
export function useDeleteCustomField(projectId: string) { ... }
```

### 2. Add Field Dialog (`add-field-dialog.tsx`)

- Dialog with form: name input, field_type select dropdown, optional description
- If type is `single_select` or `multi_select`: dynamic options list with add/remove
- Each option: label input + color picker (reuse COLORS array from project settings)
- Submit calls `useCreateCustomField` mutation

### 3. Field Config Panel (`field-config-panel.tsx`)

- List all definitions with name, type badge, required indicator
- Each row: inline name edit (contentEditable), delete button
- "Add field" button opens AddFieldDialog
- Reorder via position (drag optional, can defer to v2)
- Show warning count: "Used by X tasks" before delete

### 4. Integrate config panel in project settings

In `project-settings-dialog.tsx`, add tab/section:
```tsx
<div className="border-t border-border pt-4 mt-4">
  <p className="text-xs font-semibold text-neutral-400 uppercase mb-2">Custom Fields</p>
  <FieldConfigPanel projectId={project.id} />
</div>
```

### 5. Custom Field Renderer (`custom-field-renderer.tsx`)

Single component that switches on `field_type`:
```typescript
interface Props {
  definition: CustomFieldDefinition
  value: any
  onChange: (value: any) => void
}
```

Renderers per type:
- **text:** `<input type="text" />` (blur to save)
- **number:** `<input type="number" />` (blur to save)
- **date:** `<input type="date" />`
- **single_select:** shadcn `<Select>` with options from definition
- **multi_select:** multi-checkbox dropdown (or comma-separated tags)
- **checkbox:** `<input type="checkbox" />`
- **url:** `<input type="url" />` with external link icon

### 6. Custom Fields Section (`custom-fields-section.tsx`)

- Fetches definitions via `useCustomFields(projectId)`
- Reads values from `task.custom_fields ?? {}`
- Renders each field using `CustomFieldRenderer`
- On change: PATCH task with merged `custom_fields` object
- Empty state: "No custom fields. Configure in project settings."

### 7. Integrate in task detail drawer

In `task-detail-drawer.tsx`, add between Tags section and Attachments section:
```tsx
{/* Custom Fields */}
<CustomFieldsSection
  projectId={projectId}
  taskId={task.id}
  customFields={task.custom_fields}
  onUpdate={(fields) => updateTask.mutate({ custom_fields: fields })}
/>
```

### 8. Extend Task interface

In `use-project-tasks.ts`:
```typescript
custom_fields: Record<string, unknown> | null
```

## Todo

- [ ] Create `use-custom-fields.ts` hooks
- [ ] Create `add-field-dialog.tsx`
- [ ] Create `field-config-panel.tsx`
- [ ] Add config panel to project settings dialog
- [ ] Create `custom-field-renderer.tsx` with all type renderers
- [ ] Create `custom-fields-section.tsx`
- [ ] Integrate section in task detail drawer
- [ ] Extend Task interface
- [ ] Manual test all 7 field types end-to-end

## Success Criteria

- Admin can add/edit/delete custom field definitions in project settings
- All 7 field types render correct inputs in task drawer
- Values persist after save and reload
- Select/multi-select shows options from definition
- Empty state shown when no fields configured
- Required fields show visual indicator (not blocking for MVP)
