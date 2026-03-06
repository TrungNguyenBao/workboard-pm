# Phase 11 — Frontend: Dashboard, Search & Notifications

## Overview
- **Priority:** Medium
- **Status:** Pending
- **Description:** My Tasks dashboard, SSE real-time listener, notification bell dropdown, global search

## Context Links
- [Wireframe 02 - Dashboard](../../docs/wireframe/02-dashboard-my-tasks.html)
- [Design Guidelines](../../docs/design-guidelines.md) §7 Dashboard Widgets

## Related Code Files

### Create
```
frontend/src/features/
  dashboard/
    pages/DashboardPage.tsx       # My Tasks home
    components/
      metric-cards-row.tsx        # 4 summary cards
      my-tasks-section.tsx        # grouped task sections
      mini-calendar-widget.tsx
  notifications/
    api/notifications.api.ts
    hooks/useNotifications.ts
    hooks/useSSE.ts               # EventSource hook
    components/
      notification-bell.tsx       # bell icon + badge + dropdown
      notification-item.tsx
  search/
    components/
      global-search-command.tsx   # cmdk CommandDialog
```

## Implementation Steps

### 1. SSE Hook (hooks/useSSE.ts)
```typescript
export function useSSE() {
  const { accessToken, isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return

    const url = `/api/v1/events?token=${encodeURIComponent(accessToken)}`
    const es = new EventSource(url)
    esRef.current = es

    es.onmessage = (e) => {
      const event = JSON.parse(e.data)
      handleSSEEvent(event, queryClient)
    }

    es.onerror = () => console.warn('SSE reconnecting...')

    return () => { es.close(); esRef.current = null }
  }, [isAuthenticated, accessToken])
}

function handleSSEEvent(event: SSEEvent, qc: QueryClient) {
  switch (event.type) {
    case 'task_updated':
      qc.invalidateQueries({ queryKey: ['tasks', event.project_id] })
      qc.invalidateQueries({ queryKey: ['task', event.task_id] })
      break
    case 'task_created':
      qc.invalidateQueries({ queryKey: ['tasks', event.project_id] })
      break
    case 'comment_added':
      qc.invalidateQueries({ queryKey: ['comments', event.task_id] })
      break
    case 'notification_created':
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
      break
  }
}
```

Mount `useSSE()` once in AppShell so it's active for all pages.

### 2. My Tasks Dashboard (DashboardPage.tsx)
```typescript
function DashboardPage() {
  const { data: myTasks } = useMyTasks()

  // Group tasks by due bucket
  const grouped = useMemo(() => groupTasksByDueBucket(myTasks), [myTasks])

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-6">My Tasks</h1>

      {/* 4 metric cards */}
      <MetricCardsRow tasks={myTasks} />

      {/* Task sections */}
      <div className="mt-6 space-y-6">
        <MyTasksSection label="Overdue" tasks={grouped.overdue} variant="danger" />
        <MyTasksSection label="Today" tasks={grouped.today} variant="primary" />
        <MyTasksSection label="Upcoming" tasks={grouped.upcoming} />
        <MyTasksSection label="Later" tasks={grouped.later} />
      </div>
    </div>
  )
}
```

**Metric Cards:**
- Tasks Due Today | Overdue | Completed This Week | Active Projects
- 12px radius, border, no shadow (flat), icon + big number + label
- Click → scroll to relevant section (Today / Overdue) or navigate to Projects

**MyTasksSection:**
- Same task row style as ListView (reuse TaskRow component)
- Grouped by project (project name label above group)
- Clicking a task opens TaskDetailDrawer

**Task due bucket logic:**
```typescript
function groupTasksByDueBucket(tasks: Task[]) {
  const today = startOfDay(new Date())
  return {
    overdue: tasks.filter(t => t.due_date && isBefore(parseISO(t.due_date), today) && !t.completed_at),
    today: tasks.filter(t => t.due_date && isToday(parseISO(t.due_date))),
    upcoming: tasks.filter(t => t.due_date && isAfter(parseISO(t.due_date), today) && !isToday(parseISO(t.due_date))
               && isBefore(parseISO(t.due_date), addDays(today, 7))),
    later: tasks.filter(t => !t.due_date || isAfter(parseISO(t.due_date), addDays(today, 7))),
  }
}
```

### 3. Notification Bell (notification-bell.tsx)
```typescript
function NotificationBell() {
  const { data: count } = useUnreadCount()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="relative">
        <Bell size={18} />
        {count > 0 && <span className="notification-badge" />}  {/* 8px red dot */}
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="end">
        <NotificationDropdown />
      </PopoverContent>
    </Popover>
  )
}
```

**NotificationDropdown:**
- Header: "Notifications" + "Mark all read" link
- Tabs: All | Mentions | Assigned (shadcn Tabs)
- Scrollable list (max 480px)
- NotificationItem: avatar (32px) + action text + bold entity name + relative time
- Unread item: 3px left indigo border + slightly tinted bg
- Click: mark as read + navigate to entity (open task drawer / go to project)
- Empty state: bell icon + "You're all caught up"

### 4. Notifications API + hooks
```typescript
// notifications.api.ts
export const notificationsApi = {
  list: (params) => api.get('/notifications', { params }).then(r => r.data),
  unreadCount: () => api.get('/notifications/unread-count').then(r => r.data),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.post('/notifications/read-all').then(r => r.data),
}

// useNotifications.ts
export function useNotifications(filters?) {
  return useQuery({ queryKey: ['notifications', filters], queryFn: () => notificationsApi.list(filters) })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 60_000,   // fallback polling every minute
  })
}
```

### 5. Global Search (cmdk)
```typescript
// global-search-command.tsx
import { Command, CommandInput, CommandList, CommandItem, CommandGroup, CommandEmpty } from 'cmdk'

function GlobalSearchCommand({ open, onClose }) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  const { data: results } = useSearch(debouncedQuery)

  return (
    <CommandDialog open={open} onOpenChange={onClose}>
      <CommandInput placeholder="Search tasks, projects..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {results?.tasks?.length > 0 && (
          <CommandGroup heading="Tasks">
            {results.tasks.map(task => (
              <CommandItem key={task.id} onSelect={() => { openTaskDrawer(task.id); onClose() }}>
                <CheckSquare size={14} className="mr-2 text-neutral-400" />
                <span>{task.title}</span>
                <span className="ml-auto text-xs text-neutral-400">{task.project_name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results?.projects?.length > 0 && (
          <CommandGroup heading="Projects">
            {results.projects.map(proj => (
              <CommandItem key={proj.id} onSelect={() => { navigate(`/projects/${proj.id}`); onClose() }}>
                <Folder size={14} className="mr-2" style={{ color: proj.color }} />
                {proj.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}

// Open with Ctrl+K in AppShell
useKeyboardShortcut('k', { ctrl: true }, () => setSearchOpen(true))
```

## Todo
- [ ] Implement useSSE hook + mount in AppShell
- [ ] Implement handleSSEEvent (invalidate correct queries)
- [ ] Build DashboardPage (metric cards + task sections)
- [ ] Build MyTasksSection (reuse TaskRow)
- [ ] Implement due-bucket grouping logic
- [ ] Build NotificationBell popover
- [ ] Build NotificationDropdown (tabs, items, mark read)
- [ ] Implement notifications API + hooks
- [ ] Build GlobalSearchCommand (cmdk)
- [ ] Implement search API hook with debounce
- [ ] Test: task updated by another user → appears in current user's board within 1s
- [ ] Test: @mention in comment → notification bell badge increments

## Success Criteria
- SSE events update TanStack Query cache in real-time
- Notification bell badge shows correct unread count
- Clicking notification navigates to task + marks notification read
- "Mark all read" clears all badges
- Global search returns relevant results for task title queries
- My Tasks shows tasks assigned to current user across all projects

## Next Steps
→ Phase 12: testing
