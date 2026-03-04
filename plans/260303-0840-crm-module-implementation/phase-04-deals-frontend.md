# Phase 4: Deals Frontend

## Context Links

- [WMS products hook](../../frontend/src/modules/wms/features/products/hooks/use-products.ts)
- [WMS product form dialog](../../frontend/src/modules/wms/features/products/components/product-form-dialog.tsx)
- [WMS products list page](../../frontend/src/modules/wms/features/products/pages/products-list.tsx)
- [CRM deals list placeholder](../../frontend/src/modules/crm/features/deals/pages/deals-list.tsx)
- [CRM contact hook (Phase 3)](./phase-03-contacts-frontend.md) -- needed for contact dropdown in deal form

## Overview

- **Priority:** P2
- **Status:** completed
- **Effort:** 2h
- **Depends on:** Phase 1 (backend), Phase 2 (shared components), Phase 3 (router/sidebar already updated)

Full deals UI: TanStack Query hooks, form dialog with contact selector and stage picker, list page with stage filter and pagination.

## Key Insights

- Deal has: title (required), value (float, default 0), stage (string, default "lead"), contact_id (optional FK)
- Deal stages: `lead`, `qualified`, `proposal`, `negotiation`, `closed_won`, `closed_lost`
- Form dialog needs a contact selector -- fetch contacts list for dropdown
- Stage filter in list header uses Select component (same pattern as WMS category filter)
- Value displayed as currency formatted number
- Contact name displayed via a separate lookup or by including contact info in response

### Contact Display in Deal List

Backend `DealResponse` does not include contact name. Two options:
1. Add `contact_name` to `DealResponse` via joined load -- requires backend change
2. Fetch contacts separately and look up client-side

**Decision:** Option 2 (client-side lookup). Simpler, no backend change beyond Phase 1. Fetch all contacts (unpaginated) for the dropdown anyway. Use a small helper to map contact_id -> name.

Actually, re-evaluating: the contacts are paginated now. For the deal form dropdown, we need a lightweight contacts list. Two approaches:
- Use `useContacts` with large page_size (100) -- good enough for MVP
- Add a separate unpaginated endpoint -- YAGNI for now

**Final decision:** Use `useContacts(wsId, { page_size: 100 })` for the dropdown and contact name lookup. This covers most workspaces. If a workspace has 100+ contacts, this is a known limitation acceptable for MVP.

## Requirements

### Functional
- List deals with stage filter, search (by title), and pagination
- Create new deal via dialog with title, value, stage selector, contact selector
- Edit existing deal via dialog
- Delete deal with confirmation
- Display contact name in deal list (looked up from contacts query)
- Stage displayed as colored badge
- Value displayed as formatted currency

### Non-functional
- Hook file under 75 lines
- Dialog file under 130 lines
- Page file under 100 lines

## Architecture

```
API calls flow:
  deals-list.tsx
    -> useDeals(wsId, { stage, search, page })   -> GET /crm/workspaces/{wsId}/deals
    -> useContacts(wsId, { page_size: 100 })      -> GET /crm/workspaces/{wsId}/contacts (for name lookup)
    -> useDeleteDeal(wsId)                         -> DELETE /crm/workspaces/{wsId}/deals/{id}
  deal-form-dialog.tsx
    -> useCreateDeal(wsId)                         -> POST /crm/workspaces/{wsId}/deals
    -> useUpdateDeal(wsId)                         -> PATCH /crm/workspaces/{wsId}/deals/{id}
    -> useContacts(wsId, { page_size: 100 })       -> GET (for contact dropdown)
```

## Related Code Files

### Files to Create
1. `frontend/src/modules/crm/features/deals/hooks/use-deals.ts`
2. `frontend/src/modules/crm/features/deals/components/deal-form-dialog.tsx`

### Files to Modify
1. `frontend/src/modules/crm/features/deals/pages/deals-list.tsx` -- replace placeholder

## Implementation Steps

### Step 1: Create `use-deals.ts`

File: `frontend/src/modules/crm/features/deals/hooks/use-deals.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Deal {
  id: string
  title: string
  value: number
  stage: string
  contact_id: string | null
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface PaginatedDeals {
  items: Deal[]
  total: number
  page: number
  page_size: number
}

interface DealFilters {
  stage?: string
  contact_id?: string
  search?: string
  page?: number
  page_size?: number
}

export const DEAL_STAGES = [
  { value: 'lead', label: 'Lead' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed_won', label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' },
] as const

const base = (wsId: string) => `/crm/workspaces/${wsId}/deals`

export function useDeals(workspaceId: string, filters: DealFilters = {}) {
  const { stage, contact_id, search, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedDeals>({
    queryKey: ['crm-deals', workspaceId, { stage, contact_id, search, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { stage, contact_id, search, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateDeal(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-deals', workspaceId] }),
  })
}

export function useUpdateDeal(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ dealId, ...data }: { dealId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${dealId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-deals', workspaceId] }),
  })
}

export function useDeleteDeal(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dealId: string) => api.delete(`${base(workspaceId)}/${dealId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-deals', workspaceId] }),
  })
}
```

### Step 2: Create `deal-form-dialog.tsx`

File: `frontend/src/modules/crm/features/deals/components/deal-form-dialog.tsx`

Key differences from contact form:
- Stage selector (Select component with DEAL_STAGES)
- Contact selector (Select component populated from useContacts)
- Value field (number input)

```tsx
import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { type Deal, DEAL_STAGES, useCreateDeal, useUpdateDeal } from '../hooks/use-deals'
import { useContacts } from '../../contacts/hooks/use-contacts'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  deal?: Deal | null
}

export function DealFormDialog({ open, onOpenChange, workspaceId, deal }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DealFormContent workspaceId={workspaceId} deal={deal} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function DealFormContent({ workspaceId, deal, onOpenChange }: Omit<Props, 'open'>) {
  const createDeal = useCreateDeal(workspaceId)
  const updateDeal = useUpdateDeal(workspaceId)
  const { data: contactsData } = useContacts(workspaceId, { page_size: 100 })
  const isEdit = !!deal

  const [title, setTitle] = useState(deal?.title ?? '')
  const [value, setValue] = useState(deal?.value?.toString() ?? '0')
  const [stage, setStage] = useState(deal?.stage ?? 'lead')
  const [contactId, setContactId] = useState(deal?.contact_id ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    try {
      const payload = {
        title: title.trim(),
        value: parseFloat(value) || 0,
        stage,
        contact_id: contactId || null,
      }
      if (isEdit) {
        await updateDeal.mutateAsync({ dealId: deal.id, ...payload })
        toast({ title: 'Deal updated', variant: 'success' })
      } else {
        await createDeal.mutateAsync(payload)
        toast({ title: 'Deal created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: `Failed to ${isEdit ? 'update' : 'create'} deal`, variant: 'error' })
    }
  }

  const pending = createDeal.isPending || updateDeal.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit deal' : 'New deal'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="deal-title">Title *</Label>
          <Input id="deal-title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="deal-value">Value</Label>
            <Input id="deal-value" type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Stage</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEAL_STAGES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Contact</Label>
          <Select value={contactId} onValueChange={setContactId}>
            <SelectTrigger><SelectValue placeholder="No contact" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">No contact</SelectItem>
              {(contactsData?.items ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={pending || !title.trim()}>
            {pending ? 'Saving...' : isEdit ? 'Save changes' : 'Create deal'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
```

### Step 3: Replace `deals-list.tsx`

Replace placeholder in `frontend/src/modules/crm/features/deals/pages/deals-list.tsx`:

```tsx
import { useState, useMemo } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { CrmDataTable } from '../../shared/components/crm-data-table'
import { CrmPageHeader } from '../../shared/components/crm-page-header'
import { CrmPagination } from '../../shared/components/crm-pagination'
import { DealFormDialog } from '../components/deal-form-dialog'
import { type Deal, DEAL_STAGES, useDeals, useDeleteDeal } from '../hooks/use-deals'
import { useContacts } from '../../contacts/hooks/use-contacts'
import { toast } from '@/shared/components/ui/toast'
import { Pencil, Trash2 } from 'lucide-react'

// Stage badge color mapping
const STAGE_VARIANT: Record<string, 'default' | 'secondary'> = {
  closed_won: 'default',
  closed_lost: 'secondary',
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export default function DealsListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState<string>('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDeal, setEditDeal] = useState<Deal | null>(null)

  const { data } = useDeals(workspaceId, {
    search: search || undefined,
    stage: stage || undefined,
    page,
  })
  const { data: contactsData } = useContacts(workspaceId, { page_size: 100 })
  const deleteDeal = useDeleteDeal(workspaceId)

  // Build contact name lookup map
  const contactMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of contactsData?.items ?? []) {
      map.set(c.id, c.name)
    }
    return map
  }, [contactsData])

  const columns = [
    { key: 'title', label: 'Title', render: (d: Deal) => <span className="font-medium">{d.title}</span> },
    { key: 'value', label: 'Value', render: (d: Deal) => formatCurrency(d.value) },
    { key: 'stage', label: 'Stage', render: (d: Deal) => (
      <Badge variant={STAGE_VARIANT[d.stage] ?? 'secondary'}>
        {DEAL_STAGES.find((s) => s.value === d.stage)?.label ?? d.stage}
      </Badge>
    )},
    { key: 'contact', label: 'Contact', render: (d: Deal) => (
      d.contact_id ? contactMap.get(d.contact_id) ?? '-' : '-'
    )},
    {
      key: 'actions', label: '', className: 'w-20',
      render: (d: Deal) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          <button className="p-1 text-neutral-400 hover:text-neutral-700" onClick={() => { setEditDeal(d); setDialogOpen(true) }}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button className="p-1 text-neutral-400 hover:text-red-600" onClick={async () => {
            if (window.confirm(`Delete "${d.title}"?`)) {
              await deleteDeal.mutateAsync(d.id)
              toast({ title: 'Deal deleted', variant: 'success' })
            }
          }}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <CrmPageHeader
        title="Deals"
        description="Track sales pipeline and deal progress"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditDeal(null); setDialogOpen(true) }}
        createLabel="New deal"
      >
        <Select value={stage} onValueChange={(v) => { setStage(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All stages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {DEAL_STAGES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CrmPageHeader>
      <CrmDataTable columns={columns} data={data?.items ?? []} keyFn={(d) => d.id} emptyMessage="No deals yet" />
      <CrmPagination page={page} pageSize={20} total={data?.total ?? 0} onPageChange={setPage} />
      <DealFormDialog open={dialogOpen} onOpenChange={setDialogOpen} workspaceId={workspaceId} deal={editDeal} />
    </div>
  )
}
```

## Todo List

- [x] Create `use-deals.ts` hook with DEAL_STAGES constant
- [x] Create `deal-form-dialog.tsx` with contact and stage selectors
- [x] Replace `deals-list.tsx` placeholder with full implementation
- [x] Verify frontend compiles without errors
- [x] Test deal CRUD operations end-to-end

## Success Criteria

- Deals list loads with paginated data
- Stage filter narrows results
- Search filters by deal title
- Create dialog has title, value, stage selector, contact dropdown
- Edit dialog pre-fills all fields including stage and contact
- Delete prompts confirmation
- Contact name displayed in list (from client-side lookup)
- Value displayed as formatted currency
- Stage displayed as badge

## Risk Assessment

- **Contact dropdown limit:** Using `page_size: 100` for contacts lookup. Workspaces with 100+ contacts will show incomplete dropdown. Acceptable for MVP. Future fix: add server-side contact search in dropdown.
- **Select empty value:** Radix Select may not support empty string as value cleanly. If `""` causes issues, use a sentinel like `"none"` and map accordingly. Test during implementation.
- **Cross-feature import:** `deal-form-dialog.tsx` imports `useContacts` from contacts feature. This creates a coupling between features. Acceptable -- both are CRM module features and this is a natural dependency.

## Security Considerations

- RBAC enforced server-side: guest=read, member=create/edit, admin=delete
- Frontend hides action buttons only as UX convenience, not security
- All mutations go through authenticated API with workspace RBAC check
