# Phase 3: Contacts Frontend

## Context Links

- [WMS products hook](../../frontend/src/modules/wms/features/products/hooks/use-products.ts)
- [WMS product form dialog](../../frontend/src/modules/wms/features/products/components/product-form-dialog.tsx)
- [WMS products list page](../../frontend/src/modules/wms/features/products/pages/products-list.tsx)
- [CRM contacts list placeholder](../../frontend/src/modules/crm/features/contacts/pages/contacts-list.tsx)
- [Router](../../frontend/src/app/router.tsx)
- [Sidebar](../../frontend/src/shared/components/shell/sidebar.tsx)

## Overview

- **Priority:** P1
- **Status:** completed
- **Effort:** 1.5h
- **Depends on:** Phase 1 (backend pagination), Phase 2 (shared components)

Full contacts UI: TanStack Query hooks, form dialog for create/edit, list page with search and pagination.

## Key Insights

- WMS hook pattern: `useProducts` for list, `useCreateProduct`/`useUpdateProduct`/`useDeleteProduct` mutations
- Query keys: `['crm-contacts', workspaceId, { filters }]` -- invalidate on prefix
- API base: `/crm/workspaces/${wsId}/contacts`
- Form dialog pattern: outer shell checks `open`, inner component holds form state
- List page: state for search/page/dialog/editItem, columns array, compose header+table+pagination
- Contact fields: name (required), email, phone, company (all optional)

## Requirements

### Functional
- List contacts with search (name/email/company) and pagination
- Create new contact via dialog
- Edit existing contact via dialog (click edit icon)
- Delete contact with confirmation (click trash icon)
- Toast notifications on success/error

### Non-functional
- Hook file under 70 lines
- Dialog file under 115 lines
- Page file under 90 lines

## Architecture

```
API calls flow:
  contacts-list.tsx
    -> useContacts(wsId, { search, page })     -> GET /crm/workspaces/{wsId}/contacts
    -> useDeleteContact(wsId)                   -> DELETE /crm/workspaces/{wsId}/contacts/{id}
  contact-form-dialog.tsx
    -> useCreateContact(wsId)                   -> POST /crm/workspaces/{wsId}/contacts
    -> useUpdateContact(wsId)                   -> PATCH /crm/workspaces/{wsId}/contacts/{id}
```

## Related Code Files

### Files to Create
1. `frontend/src/modules/crm/features/contacts/hooks/use-contacts.ts`
2. `frontend/src/modules/crm/features/contacts/components/contact-form-dialog.tsx`

### Files to Modify
1. `frontend/src/modules/crm/features/contacts/pages/contacts-list.tsx` -- replace placeholder
2. `frontend/src/app/router.tsx` -- add `/crm/contacts` route
3. `frontend/src/shared/components/shell/sidebar.tsx` -- add CRM nav items

## Implementation Steps

### Step 1: Create `use-contacts.ts`

File: `frontend/src/modules/crm/features/contacts/hooks/use-contacts.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface PaginatedContacts {
  items: Contact[]
  total: number
  page: number
  page_size: number
}

interface ContactFilters {
  search?: string
  page?: number
  page_size?: number
}

const base = (wsId: string) => `/crm/workspaces/${wsId}/contacts`

export function useContacts(workspaceId: string, filters: ContactFilters = {}) {
  const { search, page = 1, page_size = 20 } = filters
  return useQuery<PaginatedContacts>({
    queryKey: ['crm-contacts', workspaceId, { search, page, page_size }],
    queryFn: () =>
      api.get(base(workspaceId), { params: { search, page, page_size } }).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useCreateContact(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(base(workspaceId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-contacts', workspaceId] }),
  })
}

export function useUpdateContact(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ contactId, ...data }: { contactId: string } & Record<string, unknown>) =>
      api.patch(`${base(workspaceId)}/${contactId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-contacts', workspaceId] }),
  })
}

export function useDeleteContact(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (contactId: string) => api.delete(`${base(workspaceId)}/${contactId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-contacts', workspaceId] }),
  })
}
```

### Step 2: Create `contact-form-dialog.tsx`

File: `frontend/src/modules/crm/features/contacts/components/contact-form-dialog.tsx`

Follow WMS product-form-dialog pattern. Fields: name (required), email, phone, company.

```tsx
import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { toast } from '@/shared/components/ui/toast'
import { type Contact, useCreateContact, useUpdateContact } from '../hooks/use-contacts'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  contact?: Contact | null
}

export function ContactFormDialog({ open, onOpenChange, workspaceId, contact }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <ContactFormContent workspaceId={workspaceId} contact={contact} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

// Inner component holds state -- unmounts when dialog closes, resetting form
function ContactFormContent({ workspaceId, contact, onOpenChange }: Omit<Props, 'open'>) {
  const createContact = useCreateContact(workspaceId)
  const updateContact = useUpdateContact(workspaceId)
  const isEdit = !!contact

  const [name, setName] = useState(contact?.name ?? '')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [company, setCompany] = useState(contact?.company ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      const payload = {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        company: company.trim() || null,
      }
      if (isEdit) {
        await updateContact.mutateAsync({ contactId: contact.id, ...payload })
        toast({ title: 'Contact updated', variant: 'success' })
      } else {
        await createContact.mutateAsync(payload)
        toast({ title: 'Contact created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: `Failed to ${isEdit ? 'update' : 'create'} contact`, variant: 'error' })
    }
  }

  const pending = createContact.isPending || updateContact.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit contact' : 'New contact'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">Name *</Label>
          <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="contact-email">Email</Label>
            <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-phone">Phone</Label>
            <Input id="contact-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-company">Company</Label>
          <Input id="contact-company" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending ? 'Saving...' : isEdit ? 'Save changes' : 'Create contact'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
```

### Step 3: Replace `contacts-list.tsx`

Replace placeholder in `frontend/src/modules/crm/features/contacts/pages/contacts-list.tsx`:

```tsx
import { useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { CrmDataTable } from '../../shared/components/crm-data-table'
import { CrmPageHeader } from '../../shared/components/crm-page-header'
import { CrmPagination } from '../../shared/components/crm-pagination'
import { ContactFormDialog } from '../components/contact-form-dialog'
import { type Contact, useContacts, useDeleteContact } from '../hooks/use-contacts'
import { toast } from '@/shared/components/ui/toast'
import { Pencil, Trash2 } from 'lucide-react'

export default function ContactsListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)

  const { data } = useContacts(workspaceId, { search: search || undefined, page })
  const deleteContact = useDeleteContact(workspaceId)

  const columns = [
    { key: 'name', label: 'Name', render: (c: Contact) => <span className="font-medium">{c.name}</span> },
    { key: 'email', label: 'Email', render: (c: Contact) => c.email ?? '-' },
    { key: 'phone', label: 'Phone', render: (c: Contact) => c.phone ?? '-' },
    { key: 'company', label: 'Company', render: (c: Contact) => c.company ?? '-' },
    {
      key: 'actions', label: '', className: 'w-20',
      render: (c: Contact) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          <button className="p-1 text-neutral-400 hover:text-neutral-700" onClick={() => { setEditContact(c); setDialogOpen(true) }}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button className="p-1 text-neutral-400 hover:text-red-600" onClick={async () => {
            if (window.confirm(`Delete "${c.name}"?`)) {
              await deleteContact.mutateAsync(c.id)
              toast({ title: 'Contact deleted', variant: 'success' })
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
        title="Contacts"
        description="Manage customers and business contacts"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditContact(null); setDialogOpen(true) }}
        createLabel="New contact"
      />
      <CrmDataTable columns={columns} data={data?.items ?? []} keyFn={(c) => c.id} emptyMessage="No contacts yet" />
      <CrmPagination page={page} pageSize={20} total={data?.total ?? 0} onPageChange={setPage} />
      <ContactFormDialog open={dialogOpen} onOpenChange={setDialogOpen} workspaceId={workspaceId} contact={editContact} />
    </div>
  )
}
```

### Step 4: Update router

In `frontend/src/app/router.tsx`, add contacts route and lazy import:

```tsx
// Add to lazy imports section (CRM module):
const CrmContactsPage = lazy(() => import('@/modules/crm/features/contacts/pages/contacts-list'))
const CrmDealsPage = lazy(() => import('@/modules/crm/features/deals/pages/deals-list'))

// Replace CRM route section:
{/* CRM module */}
<Route path="/crm" element={<Navigate to="/crm/contacts" replace />} />
<Route path="/crm/contacts" element={<CrmContactsPage />} />
<Route path="/crm/deals" element={<CrmDealsPage />} />
```

Remove the old `CrmHomePage` lazy import.

### Step 5: Update sidebar

In `frontend/src/shared/components/shell/sidebar.tsx`, add CRM nav block.

Add imports at top: `import { Handshake, DollarSign } from 'lucide-react'` (Handshake may already be unused but available via lucide).

Add CRM module condition in the nav section, after WMS block:

```tsx
) : activeModule === 'crm' ? (
  <>
    <NavItem to="/crm/contacts" icon={<Users className="h-4 w-4" />} label="Contacts" active={isActive('/crm/contacts')} />
    <NavItem to="/crm/deals" icon={<DollarSign className="h-4 w-4" />} label="Deals" active={isActive('/crm/deals')} />
    <NavItem to="/members" icon={<Users className="h-4 w-4" />} label="Members" active={isActive('/members')} />
  </>
```

Use `Users` for contacts (already imported), `DollarSign` for deals (add to import).

## Todo List

- [x] Create `use-contacts.ts` hook
- [x] Create `contact-form-dialog.tsx`
- [x] Replace `contacts-list.tsx` placeholder
- [x] Update `router.tsx` with CRM routes
- [x] Update `sidebar.tsx` with CRM nav items
- [x] Verify frontend compiles without errors

## Success Criteria

- Contacts list loads and displays paginated data
- Search filters contacts by name/email/company
- Create dialog opens, submits, shows toast, refreshes list
- Edit dialog pre-fills fields, updates, shows toast
- Delete prompts confirmation, deletes, shows toast
- Sidebar shows Contacts/Deals/Members when CRM module active
- `/crm` redirects to `/crm/contacts`

## Risk Assessment

- **Sidebar complexity:** File is 398 lines, already over 200-line limit. Adding CRM nav increases it further. Consider refactoring sidebar nav into separate file in a future pass, but for now the addition is small (~6 lines).
- **Router change:** Adding 2 routes + 2 lazy imports is straightforward.
