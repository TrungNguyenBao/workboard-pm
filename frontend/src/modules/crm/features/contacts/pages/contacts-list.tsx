import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { toast } from '@/shared/components/ui/toast'
import { CrmDataTable } from '../../shared/components/crm-data-table'
import { CrmPageHeader } from '../../shared/components/crm-page-header'
import { CrmPagination } from '../../shared/components/crm-pagination'
import { ContactFormDialog } from '../components/contact-form-dialog'
import { type Contact, useContacts, useDeleteContact } from '../hooks/use-contacts'

const PAGE_SIZE = 20

export default function ContactsListPage() {
  const { t } = useTranslation('crm')
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)

  const { data } = useContacts(workspaceId, { search: search || undefined, page, page_size: PAGE_SIZE })
  const deleteContact = useDeleteContact(workspaceId)

  const columns = [
    { key: 'name', label: t('contacts.name'), render: (c: Contact) => <span className="font-medium">{c.name}</span> },
    { key: 'email', label: t('contacts.email'), render: (c: Contact) => c.email ?? '-' },
    { key: 'phone', label: t('contacts.phone'), render: (c: Contact) => c.phone ?? '-' },
    { key: 'company', label: t('contacts.company'), render: (c: Contact) => c.company ?? '-' },
    {
      key: 'actions',
      label: '',
      className: 'w-20',
      render: (c: Contact) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            className="p-1 text-neutral-400 hover:text-neutral-700"
            onClick={() => { setEditContact(c); setDialogOpen(true) }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1 text-neutral-400 hover:text-red-600"
            onClick={async () => {
              if (window.confirm(t('common:common.deleteConfirm', { name: c.name }))) {
                await deleteContact.mutateAsync(c.id)
                toast({ title: t('contacts.deleted'), variant: 'success' })
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <CrmPageHeader
        title={t('contacts.title')}
        description={t('contacts.description')}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditContact(null); setDialogOpen(true) }}
        createLabel={t('contacts.new')}
      />
      <CrmDataTable
        columns={columns}
        data={data?.items ?? []}
        keyFn={(c) => c.id}
        emptyMessage={t('contacts.empty')}
      />
      <CrmPagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      <ContactFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        contact={editContact}
      />
    </div>
  )
}
