# Phase 2: Frontend — Type Selector + Conditional Views

**Priority:** High | **Status:** pending | **Effort:** ~2h

## Context Links
- Dialog: `frontend/src/modules/pms/features/projects/components/create-project-dialog.tsx`
- Header: `frontend/src/modules/pms/features/projects/components/project-header.tsx`
- Router: `frontend/src/app/router.tsx`
- Agile pages (future): `plans/260309-1047-pms-agile-kanban/phase-03-frontend-sprint-ui.md`

## Requirements

1. **Create project dialog** — visual type selector (3 cards: Basic / Kanban / Agile)
2. **project-header.tsx** — filter tab list based on `project.project_type`
3. **router.tsx** — add `/backlog` and `/sprints` routes (agile-only, stubs for now)
4. **Default navigation** — basic→`/list`, kanban+agile→`/board`

## View Matrix (tabs shown per type)

```
basic:  Overview, List, Calendar, Timeline
kanban: Overview, List, Board, Calendar, Timeline
agile:  Overview, List, Board, Backlog, Sprints, Calendar, Timeline
```

## Related Code Files

**Modify:**
- `frontend/src/modules/pms/features/projects/components/create-project-dialog.tsx`
- `frontend/src/modules/pms/features/projects/components/project-header.tsx`
- `frontend/src/app/router.tsx`

**Create:**
- `frontend/src/modules/pms/features/projects/pages/backlog.tsx` — stub (placeholder for Agile plan Phase 3)
- `frontend/src/modules/pms/features/projects/pages/sprints.tsx` — stub

## Implementation Steps

### 1. Type selector in `create-project-dialog.tsx`

Add `projectType` state (`'basic' | 'kanban' | 'agile'`, default `'kanban'`).

Add type cards above the name input:

```tsx
const PROJECT_TYPES = [
  {
    key: 'basic' as const,
    label: 'Basic',
    icon: List,
    description: 'Simple task lists, calendar, timeline',
  },
  {
    key: 'kanban' as const,
    label: 'Kanban',
    icon: LayoutGrid,
    description: 'Visual board with drag-and-drop columns',
  },
  {
    key: 'agile' as const,
    label: 'Agile',
    icon: Layers,
    description: 'Sprints, backlog, story points',
  },
]
```

Render as 3 clickable cards in a row:
```tsx
<div className="grid grid-cols-3 gap-2">
  {PROJECT_TYPES.map(({ key, label, icon: Icon, description }) => (
    <button
      key={key}
      type="button"
      onClick={() => setProjectType(key)}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors',
        projectType === key
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs font-medium">{label}</span>
      <span className="text-[10px] leading-tight">{description}</span>
    </button>
  ))}
</div>
```

Include `project_type` in POST body:
```tsx
await api.post(`/pms/workspaces/${workspaceId}/projects`, {
  name: name.trim(),
  color,
  project_type: projectType,
})
```

Navigate to `/list` for basic, `/board` for kanban/agile:
```tsx
const defaultView = projectType === 'basic' ? 'list' : 'board'
navigate(`/pms/projects/${data.id}/${defaultView}`)
```

### 2. Conditional tabs in `project-header.tsx`

Update `Project` interface to include `project_type`:
```tsx
interface Project { id: string; name: string; color: string; project_type: string }
```

Define full view list with `types` allowlist:
```tsx
const ALL_VIEWS = [
  { key: 'board' as const,    label: t('project.views.board'),    icon: LayoutGrid, types: ['kanban', 'agile'] },
  { key: 'list' as const,     label: t('project.views.list'),     icon: List,       types: ['basic', 'kanban', 'agile'] },
  { key: 'backlog' as const,  label: t('project.views.backlog'),  icon: Inbox,      types: ['agile'] },
  { key: 'sprints' as const,  label: t('project.views.sprints'),  icon: Layers,     types: ['agile'] },
  { key: 'calendar' as const, label: t('project.views.calendar'), icon: Calendar,   types: ['basic', 'kanban', 'agile'] },
  { key: 'overview' as const, label: t('project.views.overview'), icon: BarChart2,  types: ['basic', 'kanban', 'agile'] },
  { key: 'timeline' as const, label: t('project.views.timeline'), icon: GanttChart, types: ['basic', 'kanban', 'agile'] },
]
```

Filter dynamically:
```tsx
const VIEWS = ALL_VIEWS.filter(v =>
  v.types.includes(project?.project_type ?? 'kanban')
)
```

Update `View` type:
```tsx
type View = 'board' | 'list' | 'backlog' | 'sprints' | 'calendar' | 'overview' | 'timeline'
```

### 3. Stub pages

`backlog.tsx`:
```tsx
import { ProjectHeader } from '../components/project-header'

export default function BacklogPage() {
  return (
    <div className="flex flex-col h-full">
      <ProjectHeader activeView="backlog" />
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Backlog — coming soon
      </div>
    </div>
  )
}
```

`sprints.tsx` — same pattern, `activeView="sprints"`.

### 4. Router additions in `router.tsx`

Add lazy imports:
```tsx
const BacklogPage = lazy(() => import('@/modules/pms/features/projects/pages/backlog'))
const SprintsPage = lazy(() => import('@/modules/pms/features/projects/pages/sprints'))
```

Add routes after existing PMS routes:
```tsx
<Route path="/pms/projects/:projectId/backlog" element={<BacklogPage />} />
<Route path="/pms/projects/:projectId/sprints" element={<SprintsPage />} />
```

## Todo

- [ ] Add type selector cards to `create-project-dialog.tsx`
- [ ] Pass `project_type` in POST body
- [ ] Fix default navigate (basic→list, else→board)
- [ ] Update `Project` interface in `project-header.tsx` to include `project_type`
- [ ] Add full `ALL_VIEWS` list with `types` allowlist, filter dynamically
- [ ] Create `backlog.tsx` stub page
- [ ] Create `sprints.tsx` stub page
- [ ] Add lazy imports + routes in `router.tsx`
- [ ] Add i18n keys: `project.views.backlog`, `project.views.sprints` (both EN + VI)

## Success Criteria

- Creating a "Basic" project shows only List/Calendar/Overview/Timeline tabs
- Creating a "Kanban" project shows Board tab (default behaviour preserved)
- Creating an "Agile" project shows Backlog and Sprints tabs
- Type selector is clearly highlighted (selected state visible)
- Default landing view is correct per type

## Risk Assessment

- **i18n keys missing** — add to both `en.json` and `vi.json` translation files
- **Existing projects** — all default to `kanban`, board tab still visible → no regression
- **Agile stub pages** — must compile; real implementation in Agile plan Phase 3
