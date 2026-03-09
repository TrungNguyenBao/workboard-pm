# Phase 4: Sprint Analytics — Burndown + Velocity Charts

## Context Links
- [Phase 2 — Backend API](./phase-02-backend-api.md) (burndown/velocity endpoints)
- [Sprint analytics service](./phase-02-backend-api.md#step-3-create-sprint-analytics-service)
- [Sprint selector component](./phase-03-frontend-sprint-ui.md#step-4-create-sprintselector-component)
- [use-sprints hook](./phase-03-frontend-sprint-ui.md#step-2-create-sprints-hook)
- [recharts dep in package.json](../../frontend/package.json) (v2.15.4)
- [Overview page](../../frontend/src/modules/pms/features/projects/pages/overview.tsx)

## Overview
- **Priority:** P2
- **Status:** completed
- **Effort:** 2.5h
- **Depends on:** Phase 2 (backend endpoints must exist)
- **Parallel with:** Phase 3 (no file conflicts)
- **Description:** Burndown chart and velocity chart frontend components, sprint analytics panel accessible from the board or overview page.

## Requirements

### Functional
- Burndown line chart: X=date, Y=remaining story points (total - completed cumulative)
- Velocity bar chart: X=sprint name, Y=completed story points
- Sprint analytics panel/page showing both charts plus summary stats
- Accessible from project overview or from sprint selector "View analytics"

### Non-Functional
- Use recharts v2 (already installed)
- Responsive charts that work in sidebar panels and full-width layouts
- Each component under 200 lines
- No additional npm deps

## Architecture

### Component Tree

```
SprintAnalyticsPanel
  SprintSummaryStats (total tasks, completed, remaining points)
  BurndownChart (recharts LineChart)
  VelocityChart (recharts BarChart)
```

### Data Flow

```
GET /pms/projects/{id}/sprints/{sid}/burndown  ->  BurndownChart
  Returns: { date, completed_points, total_points }[]

GET /pms/projects/{id}/velocity  ->  VelocityChart
  Returns: { sprint_id, sprint_name, completed_points }[]
```

## Related Code Files

### Files to CREATE
1. `frontend/src/modules/pms/features/projects/hooks/use-sprint-analytics.ts`
2. `frontend/src/modules/pms/features/projects/components/burndown-chart.tsx`
3. `frontend/src/modules/pms/features/projects/components/velocity-chart.tsx`
4. `frontend/src/modules/pms/features/projects/components/sprint-analytics-panel.tsx`

### Files to MODIFY
1. `frontend/src/modules/pms/features/projects/pages/overview.tsx` -- add sprint analytics section
2. `frontend/src/modules/pms/features/projects/components/sprint-selector.tsx` -- add "Analytics" menu item (if Phase 3 is done first)

## Implementation Steps

### Step 1: Create analytics hooks

Create `frontend/src/modules/pms/features/projects/hooks/use-sprint-analytics.ts`:

```typescript
import { useQuery } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface BurndownPoint {
  date: string
  completed_points: number
  total_points: number
}

export interface VelocityPoint {
  sprint_id: string
  sprint_name: string
  completed_points: number
}

export function useBurndownData(projectId: string, sprintId: string | null) {
  return useQuery<BurndownPoint[]>({
    queryKey: ['burndown', projectId, sprintId],
    queryFn: () =>
      api.get(`/pms/projects/${projectId}/sprints/${sprintId}/burndown`).then((r) => r.data),
    enabled: !!projectId && !!sprintId,
  })
}

export function useVelocityData(projectId: string) {
  return useQuery<VelocityPoint[]>({
    queryKey: ['velocity', projectId],
    queryFn: () =>
      api.get(`/pms/projects/${projectId}/velocity`).then((r) => r.data),
    enabled: !!projectId,
  })
}
```

### Step 2: Create BurndownChart component

Create `frontend/src/modules/pms/features/projects/components/burndown-chart.tsx`:

```tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { BurndownPoint } from '../hooks/use-sprint-analytics'

interface Props {
  data: BurndownPoint[]
}

export function BurndownChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No burndown data available. Start a sprint with tasks that have story points.
      </p>
    )
  }

  // Transform: remaining = total - completed_cumulative
  const totalPoints = data[0]?.total_points ?? 0
  const chartData = data.map((d) => ({
    date: d.date.slice(5), // MM-DD for compact display
    remaining: totalPoints - d.completed_points,
    ideal: 0, // computed below
  }))

  // Ideal burndown line: linear from totalPoints to 0
  const len = chartData.length
  chartData.forEach((d, i) => {
    d.ideal = Math.round(totalPoints * (1 - i / Math.max(len - 1, 1)))
  })

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="remaining"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Remaining"
          />
          <Line
            type="monotone"
            dataKey="ideal"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name="Ideal"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### Step 3: Create VelocityChart component

Create `frontend/src/modules/pms/features/projects/components/velocity-chart.tsx`:

```tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { VelocityPoint } from '../hooks/use-sprint-analytics'

interface Props {
  data: VelocityPoint[]
}

export function VelocityChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No velocity data yet. Complete sprints with story points to see velocity.
      </p>
    )
  }

  // Reverse so oldest sprint is on the left
  const chartData = [...data].reverse().map((d) => ({
    name: d.sprint_name,
    points: d.completed_points,
  }))

  // Average velocity
  const avg = Math.round(
    chartData.reduce((sum, d) => sum + d.points, 0) / chartData.length
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">
          Avg velocity: <span className="font-medium text-foreground">{avg} pts/sprint</span>
        </span>
      </div>
      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="points" name="Completed Points" radius={[4, 4, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell key={index} fill="hsl(var(--primary))" fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

### Step 4: Create SprintAnalyticsPanel

Create `frontend/src/modules/pms/features/projects/components/sprint-analytics-panel.tsx`:

```tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { useSprints } from '../hooks/use-sprints'
import { useBurndownData, useVelocityData } from '../hooks/use-sprint-analytics'
import { BurndownChart } from './burndown-chart'
import { VelocityChart } from './velocity-chart'

interface Props {
  projectId: string
}

export function SprintAnalyticsPanel({ projectId }: Props) {
  const { t } = useTranslation('pms')
  const { data: sprints = [] } = useSprints(projectId)
  const activeSprints = sprints.filter((s) => s.status === 'active' || s.status === 'completed')

  // Default to active sprint, fallback to most recent completed
  const defaultSprintId = sprints.find((s) => s.status === 'active')?.id
    ?? activeSprints[0]?.id
    ?? null

  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(defaultSprintId)
  const { data: burndownData = [] } = useBurndownData(projectId, selectedSprintId)
  const { data: velocityData = [] } = useVelocityData(projectId)

  const selectedSprint = sprints.find((s) => s.id === selectedSprintId)

  return (
    <div className="space-y-6">
      {/* Sprint Selector for burndown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Sprint Burndown</h3>
          {activeSprints.length > 0 && (
            <Select
              value={selectedSprintId ?? ''}
              onValueChange={(v) => setSelectedSprintId(v)}
            >
              <SelectTrigger className="h-7 w-44 text-xs">
                <SelectValue placeholder="Select sprint" />
              </SelectTrigger>
              <SelectContent>
                {activeSprints.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Summary stats */}
        {selectedSprint && (
          <div className="flex gap-4 mb-4">
            <StatCard label="Total Points" value={selectedSprint.total_points} />
            <StatCard label="Completed" value={selectedSprint.completed_points} />
            <StatCard
              label="Remaining"
              value={selectedSprint.total_points - selectedSprint.completed_points}
            />
            <StatCard label="Tasks" value={selectedSprint.task_count} />
          </div>
        )}

        <BurndownChart data={burndownData} />
      </div>

      {/* Velocity */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Team Velocity</h3>
        <VelocityChart data={velocityData} />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 rounded-md border border-border p-3 text-center">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </div>
  )
}
```

### Step 5: Add analytics to Overview page

In `frontend/src/modules/pms/features/projects/pages/overview.tsx`, add the analytics panel.

Read the existing overview.tsx first to determine exact insertion point. Add at the bottom of the page content:

```tsx
import { SprintAnalyticsPanel } from '../components/sprint-analytics-panel'

// Inside the page JSX, add a new section:
<div className="border-t border-border pt-6 mt-6">
  <SprintAnalyticsPanel projectId={projectId!} />
</div>
```

This adds ~4 lines to overview.tsx. All chart logic is encapsulated in the panel component.

## Todo List

- [ ] Create `use-sprint-analytics.ts` hook (burndown + velocity queries)
- [ ] Create `burndown-chart.tsx` (recharts LineChart with ideal line)
- [ ] Create `velocity-chart.tsx` (recharts BarChart with average)
- [ ] Create `sprint-analytics-panel.tsx` (composition of charts + stats)
- [ ] Add `SprintAnalyticsPanel` to overview.tsx
- [ ] Verify burndown chart renders with mock/real data
- [ ] Verify velocity chart renders with mock/real data
- [ ] Verify empty states display helpful messages

## Success Criteria

- Burndown chart shows remaining points line + ideal dashed line
- Velocity bar chart shows completed points per sprint (last 10)
- Average velocity displayed above velocity chart
- Sprint summary stats (total/completed/remaining points, task count)
- Sprint selector on burndown allows switching between active/completed sprints
- Empty states render cleanly when no data
- All files under 200 lines
- Charts use theme CSS variables (hsl(var(--primary))) for consistent theming

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| recharts v2 API differences from v3 | Stick to stable v2 API used in existing codebase (already in deps) |
| Burndown data empty when no story_points set | Show helpful empty state message guiding user to add story points |
| Chart rendering in dark mode | Use CSS variables (`hsl(var(--primary))`) not hardcoded colors |
| Large number of data points (long sprint) | Charts handle this well; XAxis tick rotation if needed |

## Security Considerations

- All data fetched via project-scoped endpoints with RBAC
- No client-side data mutation in analytics (read-only)
