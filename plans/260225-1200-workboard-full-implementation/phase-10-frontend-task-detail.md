# Phase 10 — Frontend: Task Detail Drawer

## Overview
- **Priority:** High
- **Status:** Pending
- **Description:** 480px right-side Sheet for full task editing, comments, subtasks, attachments

## Context Links
- [Wireframe 04](../../docs/wireframe/04-task-detail-drawer.html)
- [Design Guidelines](../../docs/design-guidelines.md) §5 Task Detail

## Related Code Files

### Create
```
frontend/src/features/tasks/
  components/
    TaskDetailDrawer.tsx          # Sheet wrapper
    task-title-editor.tsx         # large contenteditable h1
    task-status-priority-row.tsx
    task-meta-row.tsx             # assignee, due date, start date
    task-description-editor.tsx   # Tiptap
    task-subtasks-section.tsx
    task-attachments-section.tsx
    task-activity-feed.tsx
    task-comment-composer.tsx     # @mention support
    mention-suggestion.tsx        # Tiptap mention extension dropdown
    keyboard-shortcuts-overlay.tsx
  hooks/
    useTaskDetail.ts
    useTaskUpdate.ts
    useComments.ts
    useAttachments.ts
```

## Implementation Steps

### 1. TaskDetailDrawer wrapper (Sheet)
```typescript
// TaskDetailDrawer.tsx
import { Sheet, SheetContent } from '@/shared/components/ui/sheet'

interface Props {
  taskId: string | null
  onClose: () => void
}

function TaskDetailDrawer({ taskId, onClose }: Props) {
  const { data: task, isLoading } = useTaskDetail(taskId)

  return (
    <Sheet open={!!taskId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[480px] p-0 overflow-y-auto">
        {isLoading ? <DrawerSkeleton /> : task ? <TaskDetailContent task={task} /> : null}
      </SheetContent>
    </Sheet>
  )
}
```

### 2. Layout sections (top to bottom, per wireframe)

**Header row:**
```typescript
// Breadcrumb: Project → Section → Task (clickable)
// Close button (X) absolute top-right
// ↑ ↓ navigation (prev/next task in section)
```

**Status + Priority row:**
```typescript
// Status: shadcn Badge as dropdown (Incomplete / Completed)
// Priority: colored dot + label dropdown (None/Low/Medium/High)
// Inline, side by side
```

**Title editor:**
```typescript
// Large contenteditable span or Tiptap bare mode
// 24px, 600 weight
// Auto-save on blur (debounced 500ms)
// Placeholder: "Task title"
```

**Meta row (3-col):**
```typescript
// Assignee: avatar picker popover (search workspace members)
// Due date: date picker popover (shadcn Calendar)
// Start date: date picker popover
```

**Description (Tiptap):**
```typescript
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'

const editor = useEditor({
  extensions: [
    StarterKit,
    Mention.configure({
      HTMLAttributes: { class: 'mention' },
      suggestion: mentionSuggestion,   // popover for @user
    })
  ],
  content: task.description,
  onUpdate: ({ editor }) => debouncedSave(editor.getHTML()),
})
```

**Subtasks section:**
```typescript
// Accordion (open by default if subtasks exist)
// Each subtask: checkbox + title + assignee avatar + due date
// Checkbox → complete/incomplete mutation
// "+ Add subtask" at bottom → inline title input
// Click subtask title → navigate to subtask (nested drawer or replace)
// Max depth indicator if at 3 levels
```

**Attachments grid:**
```typescript
// 2-column thumbnail grid
// Image files: preview thumbnail
// Other files: icon + filename + size
// Hover: delete button overlay
// Upload zone: drag-drop or click
//   → multipart POST /tasks/{id}/attachments
//   → show upload progress bar
```

**Activity feed:**
```typescript
// Chronological list (comments + system events)
// System event style: small dot + gray text "Alex assigned this to Maria"
// Comment style: avatar (32px) + name + timestamp + content (Tiptap rendered HTML)
// Author can edit/delete own comments (hover reveals edit icon)
// @mentions highlighted as colored spans
```

**Comment composer:**
```typescript
// Tiptap with Mention extension (same mentionSuggestion)
// Placeholder: "Add a comment or note..."
// Submit: Ctrl+Enter or "Send" button
// Cancel: Escape
// Shows @mention autocomplete popover (search workspace members)
```

### 3. Mention suggestion (mention-suggestion.tsx)
```typescript
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'

const mentionSuggestion = {
  items: async ({ query }) => {
    const users = await workspaceApi.searchMembers(query)
    return users.slice(0, 8)
  },
  render: () => {
    let component, popup
    return {
      onStart: (props) => {
        component = new ReactRenderer(MentionList, { props, editor: props.editor })
        popup = tippy('body', { getReferenceClientRect: props.clientRect, content: component.element, ... })
      },
      onUpdate: (props) => { component.updateProps(props); popup[0].setProps(...) },
      onKeyDown: (props) => component.ref?.onKeyDown(props),
      onExit: () => { popup[0].destroy(); component.destroy() }
    }
  }
}
```

### 4. Auto-save pattern
```typescript
// useTaskUpdate.ts
export function useTaskUpdate(taskId: string) {
  const mutation = useMutation({
    mutationFn: (update: Partial<TaskUpdate>) => tasksApi.update(taskId, update),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task', taskId] })
  })

  const debouncedUpdate = useMemo(
    () => debounce((data: Partial<TaskUpdate>) => mutation.mutate(data), 500),
    [mutation]
  )

  return { update: mutation.mutate, debouncedUpdate }
}
```

### 5. Keyboard shortcuts overlay
```typescript
// "?" key opens modal with all shortcuts
const SHORTCUTS = [
  { key: 'Enter', desc: 'Open task detail' },
  { key: 'Ctrl+K', desc: 'Global search' },
  { key: 'Ctrl+Z', desc: 'Undo (delete/complete)' },
  { key: 'Tab+Q', desc: 'Quick-add task' },
  { key: '?', desc: 'Show shortcuts' },
  { key: 'Esc', desc: 'Close drawer / cancel' },
]

useKeyboardShortcut('?', () => setShortcutsOpen(true))
```

## Todo
- [ ] Build TaskDetailDrawer Sheet wrapper
- [ ] Build all detail sections (title, status/priority, meta, description)
- [ ] Integrate Tiptap for description (auto-save on blur)
- [ ] Build assignee picker popover (search members)
- [ ] Build date picker popovers (shadcn Calendar)
- [ ] Build subtasks section (checkbox complete, add inline)
- [ ] Build attachments section (upload, preview, delete)
- [ ] Build activity feed (comments + system events)
- [ ] Build comment composer with Tiptap + mention suggestion
- [ ] Build keyboard shortcuts overlay
- [ ] Test: edit title → auto-saves within 500ms
- [ ] Test: @mention in comment → user gets notification

## Success Criteria
- Drawer opens from board card / list row click
- All task fields editable inline (no separate edit mode)
- Description saves automatically on stop typing
- @mention in composer shows user dropdown, submitting creates notification
- File upload shows progress, appears in grid after complete
- Subtask checkbox updates status, updates parent subtask count

## Next Steps
→ Phase 11: dashboard + notifications
