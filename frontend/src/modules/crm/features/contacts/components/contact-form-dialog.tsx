import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('crm')
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
      toast({ title: 'Failed to save contact', variant: 'error' })
    }
  }

  const pending = createContact.isPending || updateContact.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit contact' : t('contacts.new')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">{t('contacts.name')} *</Label>
          <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="contact-email">{t('contacts.email')}</Label>
            <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-phone">{t('contacts.phone')}</Label>
            <Input id="contact-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-company">{t('contacts.company')}</Label>
          <Input id="contact-company" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('common:common.cancel')}</Button>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending ? t('common:common.loading') : isEdit ? t('common:common.save') : t('contacts.new')}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
