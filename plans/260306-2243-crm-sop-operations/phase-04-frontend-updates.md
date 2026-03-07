# Phase 4: Frontend Updates

## Context Links
- [plan.md](./plan.md)
- [Phase 3](./phase-03-backend-router-updates.md)
- Frontend CRM: `frontend/src/modules/crm/features/`

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 3h
- **Depends on:** Phase 3 (API endpoints must be live)
- **Description:** Update frontend hooks with new API calls, enhance existing list/form pages to surface workflow data, add dashboard widgets for governance and funnel.

## Architecture Notes
- All hooks follow TanStack Query v5 pattern with `useQuery` / `useMutation`
- Pages use shadcn/ui components
- Files must stay under 200 lines
- `useWorkspaceStore` provides `activeWorkspaceId`

---

## 1. Hook Updates

### Modify: `features/leads/hooks/use-leads.ts`

Add new fields to `Lead` interface and two new hooks:

```typescript
// Add to Lead interface:
export interface Lead {
  // ... existing fields ...
  contacted_at: string | null
  assigned_at: string | null
}

// New hooks:
export function useDistributeLeads(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api.post(`${base(workspaceId)}/distribute`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-leads', workspaceId] }),
  })
}

export function useStaleLeads(workspaceId: string, hours = 48) {
  return useQuery({
    queryKey: ['crm-leads-stale', workspaceId, hours],
    queryFn: () =>
      api.get(`${base(workspaceId)}/stale`, { params: { hours } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}
```

File stays under 120 lines.

### Modify: `features/deals/hooks/use-deals.ts`

Add new fields to `Deal` interface, add close and stale hooks:

```typescript
// Add to Deal interface:
export interface Deal {
  // ... existing fields ...
  last_activity_date: string | null
  loss_reason: string | null
  closed_at: string | null
  owner_id: string | null
  last_updated_by: string | null
}

// Add "needs_analysis" to DEAL_STAGES:
export const DEAL_STAGES = [
  { value: 'lead', label: 'Lead' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'needs_analysis', label: 'Needs Analysis' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed_won', label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' },
] as const

// New hooks:
export function useCloseDeal(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ dealId, action, loss_reason }: {
      dealId: string; action: 'won' | 'lost'; loss_reason?: string
    }) =>
      api.post(`${base(workspaceId)}/${dealId}/close`, { action, loss_reason })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-deals', workspaceId] })
      qc.invalidateQueries({ queryKey: ['crm-analytics', workspaceId] })
    },
  })
}

export function useStaleDeals(workspaceId: string, days = 30) {
  return useQuery({
    queryKey: ['crm-deals-stale', workspaceId, days],
    queryFn: () =>
      api.get(`${base(workspaceId)}/stale`, { params: { days } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}
```

File grows to ~110 lines. Still under limit.

### Modify: `features/activities/hooks/use-activities.ts`

Add to existing `Activity` interface (if one exists; if not, the hook uses inline types -- add interface):

```typescript
// Ensure interface includes:
outcome: string | null
next_action_date: string | null
```

### Modify: `features/tickets/hooks/use-tickets.ts`

Add to `Ticket` interface:

```typescript
resolved_at: string | null
closed_at: string | null
resolution_notes: string | null
```

### Modify: `features/accounts/hooks/use-accounts.ts`

Add to `Account` interface + new hook:

```typescript
source_deal_id: string | null
next_follow_up_date: string | null
health_score: number

// New hook:
export function useAccountFollowUps(workspaceId: string) {
  return useQuery({
    queryKey: ['crm-account-followups', workspaceId],
    queryFn: () =>
      api.get(`/crm/workspaces/${workspaceId}/accounts/follow-ups`).then((r) => r.data),
    enabled: !!workspaceId,
  })
}
```

### New: `features/dashboard/hooks/use-governance-alerts.ts` (~30 lines)

```typescript
import { useQuery } from '@tanstack/react-query'
import { useWorkspaceStore } from '@/stores/workspace.store'
import api from '@/shared/lib/api'

export interface GovernanceAlerts {
  stale_deals_count: number
  stale_deals: { id: string; title: string; stage: string }[]
  stale_leads_count: number
  unassigned_leads: number
  overdue_tickets: number
}

export function useGovernanceAlerts() {
  const wsId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  return useQuery<GovernanceAlerts>({
    queryKey: ['crm-governance', wsId],
    queryFn: () =>
      api.get(`/crm/workspaces/${wsId}/governance/alerts`).then((r) => r.data),
    enabled: !!wsId,
  })
}
```

---

## 2. New Components

### `features/deals/components/deal-close-dialog.tsx` (~90 lines)

Dialog with two buttons: "Mark Won" and "Mark Lost".
- Won: confirmation only, calls `useCloseDeal` with `action: "won"`
- Lost: shows text input for `loss_reason` (required), then calls with `action: "lost"`
- On success: close dialog, toast notification, queries invalidated by hook

```
Props: { dealId: string; dealTitle: string; open: boolean; onOpenChange: (v: boolean) => void }
```

Uses: `Dialog`, `DialogContent`, `DialogHeader`, `Button`, `Input`, `Label` from shadcn/ui.

### `features/leads/components/lead-distribute-dialog.tsx` (~60 lines)

Simple confirmation dialog:
- "Distribute N unassigned leads to team members via round-robin?"
- Calls `useDistributeLeads` mutation
- Shows result count on success

### `features/dashboard/components/stale-deals-alert.tsx` (~50 lines)

Card showing stale deals from governance alerts:
- Title: "Stale Deals" with count badge
- List of up to 5 stale deal titles with stage badge
- Link to deals list filtered by stale

### `features/dashboard/components/sales-funnel-chart.tsx` (~70 lines)

Vertical funnel visualization using recharts `BarChart` (horizontal bars, descending width):
- Bars: Total Leads -> Qualified -> Opportunity -> Closed Won
- Data from analytics endpoint `lead_status_counts` + `deals_won`
- Uses existing `STAGE_COLORS` pattern

---

## 3. Page Modifications

### Modify: `features/leads/pages/leads-list.tsx`

- Add "Distribute" button (visible to admins) that opens `lead-distribute-dialog`
- Add `score` column display (already in data, just show it)
- Add stale indicator: orange dot next to leads with `status=new` and `created_at` > 48h ago
- Show `assigned_at` in table if present

### Modify: `features/deals/pages/deals-list.tsx`

- Add "Close Deal" action in row dropdown menu -> opens `deal-close-dialog`
- Show `loss_reason` in expandable row detail for closed_lost deals

### Modify: `features/deals/pages/deals-pipeline.tsx`

- Highlight stale deals (no activity >30 days) with orange border on deal cards
- Compare `last_activity_date` with current date in `deal-card.tsx`

### Modify: `features/deals/components/deal-card.tsx`

- Add stale indicator: if `last_activity_date` is null or >30 days ago, show warning icon
- Show `owner_id` as avatar/initials if present

### Modify: `features/deals/components/deal-form-dialog.tsx`

- Add `loss_reason` field (shown only when stage is `closed_lost`)
- Add `owner_id` select field

### Modify: `features/tickets/components/ticket-form-dialog.tsx`

- Add `resolution_notes` textarea (shown when status is `resolved` or `closed`)
- Status dropdown should only show valid transitions from current status

### Modify: `features/accounts/pages/account-detail.tsx`

- Show `health_score` as a colored badge (green >70, yellow 40-70, red <40)
- Show `next_follow_up_date` with overdue highlight
- Show `source_deal_id` link if present

### Modify: `features/dashboard/pages/crm-dashboard.tsx`

- Add `stale-deals-alert` component below KPI cards
- Add `sales-funnel-chart` component in the charts row
- Import from `use-governance-alerts` hook

Dashboard page is currently 127 lines. Adding imports + two component slots adds ~15 lines -> ~142 lines, under limit.

---

## 4. Update `use-crm-stats.ts`

Add funnel data extraction from analytics response:

```typescript
// Add to CrmAnalytics interface:
export interface CrmAnalytics {
  // ... existing fields ...
  sales_funnel?: {
    total_leads: number
    qualified: number
    opportunity: number
    closed_won: number
  }
  deal_velocity_days?: number
}

// Add to return:
const funnel = analytics?.sales_funnel ?? {
  total_leads: 0, qualified: 0, opportunity: 0, closed_won: 0
}

return { stats, stageBars, leadSourceBars, funnel, isLoading: analyticsQuery.isLoading }
```

---

## Implementation Steps

1. Update `use-leads.ts` -- add fields + distribute/stale hooks
2. Update `use-deals.ts` -- add fields + close/stale hooks + needs_analysis stage
3. Update `use-activities.ts` -- add outcome/next_action_date fields
4. Update `use-tickets.ts` -- add resolved_at/closed_at/resolution_notes fields
5. Update `use-accounts.ts` -- add new fields + follow-ups hook
6. Create `use-governance-alerts.ts`
7. Update `use-crm-stats.ts` -- add funnel data
8. Create `deal-close-dialog.tsx`
9. Create `lead-distribute-dialog.tsx`
10. Create `stale-deals-alert.tsx`
11. Create `sales-funnel-chart.tsx`
12. Modify `leads-list.tsx` -- distribute button, score column, stale indicator
13. Modify `deals-list.tsx` -- close deal action
14. Modify `deals-pipeline.tsx` -- stale deal highlight
15. Modify `deal-card.tsx` -- stale warning icon
16. Modify `deal-form-dialog.tsx` -- loss_reason, owner_id fields
17. Modify `ticket-form-dialog.tsx` -- resolution_notes, status transitions
18. Modify `account-detail.tsx` -- health score, follow-up date
19. Modify `crm-dashboard.tsx` -- add stale alert + funnel chart
20. Run `pnpm tsc --noEmit` to verify no type errors
21. Run `make lint` for frontend

## Related Code Files

### Create
- `frontend/src/modules/crm/features/deals/components/deal-close-dialog.tsx`
- `frontend/src/modules/crm/features/leads/components/lead-distribute-dialog.tsx`
- `frontend/src/modules/crm/features/dashboard/components/stale-deals-alert.tsx`
- `frontend/src/modules/crm/features/dashboard/components/sales-funnel-chart.tsx`
- `frontend/src/modules/crm/features/dashboard/hooks/use-governance-alerts.ts`

### Modify
- `frontend/src/modules/crm/features/leads/hooks/use-leads.ts`
- `frontend/src/modules/crm/features/deals/hooks/use-deals.ts`
- `frontend/src/modules/crm/features/activities/hooks/use-activities.ts`
- `frontend/src/modules/crm/features/tickets/hooks/use-tickets.ts`
- `frontend/src/modules/crm/features/accounts/hooks/use-accounts.ts`
- `frontend/src/modules/crm/features/dashboard/hooks/use-crm-stats.ts`
- `frontend/src/modules/crm/features/leads/pages/leads-list.tsx`
- `frontend/src/modules/crm/features/deals/pages/deals-list.tsx`
- `frontend/src/modules/crm/features/deals/pages/deals-pipeline.tsx`
- `frontend/src/modules/crm/features/deals/components/deal-card.tsx`
- `frontend/src/modules/crm/features/deals/components/deal-form-dialog.tsx`
- `frontend/src/modules/crm/features/tickets/components/ticket-form-dialog.tsx`
- `frontend/src/modules/crm/features/accounts/pages/account-detail.tsx`
- `frontend/src/modules/crm/features/dashboard/pages/crm-dashboard.tsx`

## Todo List
- [ ] Update use-leads.ts (interface + 2 hooks)
- [ ] Update use-deals.ts (interface + 2 hooks + needs_analysis stage)
- [ ] Update use-activities.ts (interface fields)
- [ ] Update use-tickets.ts (interface fields)
- [ ] Update use-accounts.ts (interface + follow-ups hook)
- [ ] Create use-governance-alerts.ts
- [ ] Update use-crm-stats.ts (funnel data)
- [ ] Create deal-close-dialog.tsx
- [ ] Create lead-distribute-dialog.tsx
- [ ] Create stale-deals-alert.tsx
- [ ] Create sales-funnel-chart.tsx
- [ ] Modify leads-list.tsx (distribute button, score, stale indicator)
- [ ] Modify deals-list.tsx (close deal action)
- [ ] Modify deals-pipeline.tsx + deal-card.tsx (stale highlight)
- [ ] Modify deal-form-dialog.tsx (loss_reason, owner_id)
- [ ] Modify ticket-form-dialog.tsx (resolution_notes, valid transitions)
- [ ] Modify account-detail.tsx (health score, follow-up)
- [ ] Modify crm-dashboard.tsx (stale alert + funnel chart)
- [ ] Run tsc --noEmit + make lint

## Success Criteria
- Dashboard shows stale deals alert widget with counts
- Dashboard shows sales funnel chart
- Lead list has working "Distribute" button (admin only)
- Lead list shows score and stale indicator
- Deal close dialog correctly handles won (auto-creates account) and lost (requires reason)
- Deal pipeline highlights stale deals with visual indicator
- Ticket form shows resolution_notes when resolved/closed
- Account detail shows health score badge and follow-up date
- All TypeScript types compile without errors
- No ESLint errors

## Risk Assessment
- **Admin-only features:** Distribute and governance are admin-only on backend; frontend should hide buttons for non-admin users. Check how RBAC role is exposed to frontend (likely in workspace store or user context).
- **recharts funnel:** No native funnel chart in recharts -- use horizontal BarChart with decreasing values as approximation. Acceptable for MVP.
- **File size:** Dashboard page is close to limit (~142 lines after changes). If it exceeds 200, extract KPI card grid into `dashboard-kpi-grid.tsx` component.
