import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { useContact360 } from '../hooks/use-contact-detail'

type Tab = 'overview' | 'deals' | 'activities' | 'emails' | 'tickets'

export default function ContactDetailPage() {
  const { contactId } = useParams<{ contactId: string }>()
  const navigate = useNavigate()
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const { data, isLoading } = useContact360(workspaceId, contactId ?? '')
  const [tab, setTab] = useState<Tab>('overview')

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <div className="h-7 w-48 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  if (!data) return <div className="p-4 sm:p-6 text-muted-foreground">Contact not found</div>

  const { contact, deals, activities, emails, tickets } = data
  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'overview', label: 'Overview', count: 0 },
    { key: 'deals', label: 'Deals', count: deals.length },
    { key: 'activities', label: 'Activities', count: activities.length },
    { key: 'emails', label: 'Emails', count: emails.length },
    { key: 'tickets', label: 'Tickets', count: tickets.length },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/crm/contacts')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">{contact.name}</h2>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
            {count > 0 && (
              <span className="ml-1.5 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid gap-3 text-sm">
          <InfoRow label="Email" value={contact.email ?? '-'} />
          <InfoRow label="Phone" value={contact.phone ?? '-'} />
          <InfoRow label="Company" value={contact.company ?? '-'} />
          <InfoRow label="Created" value={new Date(contact.created_at).toLocaleDateString()} />
        </div>
      )}

      {tab === 'deals' && (
        <SimpleList
          items={deals}
          empty="No deals linked"
          renderItem={(d) => (
            <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
              <span className="text-sm font-medium">{d.title}</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{d.stage}</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(d.value)}
                </span>
              </div>
            </div>
          )}
        />
      )}

      {tab === 'activities' && (
        <SimpleList
          items={activities}
          empty="No activities"
          renderItem={(a) => (
            <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{a.type}</Badge>
                <span className="text-sm">{a.subject}</span>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString()}</span>
            </div>
          )}
        />
      )}

      {tab === 'emails' && (
        <SimpleList
          items={emails}
          empty="No emails"
          renderItem={(e) => (
            <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
              <span className="text-sm">{e.subject}</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{e.direction}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(e.sent_at).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        />
      )}

      {tab === 'tickets' && (
        <SimpleList
          items={tickets}
          empty="No tickets"
          renderItem={(t) => (
            <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
              <span className="text-sm">{t.subject}</span>
              <div className="flex items-center gap-2">
                <Badge variant={t.priority === 'critical' ? 'danger' : 'secondary'}>{t.priority}</Badge>
                <Badge variant="secondary">{t.status}</Badge>
              </div>
            </div>
          )}
        />
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-1.5 border-b border-border/50 last:border-0">
      <span className="w-24 text-muted-foreground shrink-0">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

function SimpleList<T extends { id: string }>({
  items,
  empty,
  renderItem,
}: {
  items: T[]
  empty: string
  renderItem: (item: T) => React.ReactNode
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">{empty}</p>
  }
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card divide-y divide-border">
      {items.map((item) => (
        <div key={item.id}>{renderItem(item)}</div>
      ))}
    </div>
  )
}
