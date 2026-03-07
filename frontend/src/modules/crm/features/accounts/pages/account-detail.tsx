import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Users, DollarSign, Activity as ActivityIcon, Ticket } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { useAccount360 } from '../hooks/use-accounts'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export default function AccountDetailPage() {
  const { accountId } = useParams<{ accountId: string }>()
  const navigate = useNavigate()
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const { data, isLoading } = useAccount360(workspaceId, accountId ?? '')

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-7 w-40 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  if (!data) return <div className="p-6 text-muted-foreground">Account not found</div>

  const { account, contacts, deals, activities, tickets } = data

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/crm/accounts')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" /> {account.name}
          </h2>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{account.industry ?? 'No industry'} &middot; {account.status}</p>
            <HealthBadge score={account.health_score ?? 100} />
            {account.next_follow_up_date && (
              <span className={`text-xs px-2 py-0.5 rounded ${new Date(account.next_follow_up_date) <= new Date() ? 'bg-red-500/10 text-red-500' : 'bg-muted text-muted-foreground'}`}>
                Follow-up: {account.next_follow_up_date}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="h-4 w-4" />} label="Contacts" value={contacts.length} />
        <StatCard icon={<DollarSign className="h-4 w-4" />} label="Deals" value={deals.length} />
        <StatCard icon={<ActivityIcon className="h-4 w-4" />} label="Activities" value={activities.length} />
        <StatCard icon={<Ticket className="h-4 w-4" />} label="Tickets" value={tickets.length} />
      </div>

      {/* Contacts */}
      <Section title="Contacts">
        {contacts.length === 0 ? <EmptyText>No contacts linked</EmptyText> : (
          <div className="space-y-1">
            {contacts.map((c: Record<string, string>) => (
              <div key={c.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                <span className="text-sm font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.email ?? '-'}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Deals */}
      <Section title="Deals">
        {deals.length === 0 ? <EmptyText>No deals</EmptyText> : (
          <div className="space-y-1">
            {deals.map((d: Record<string, string | number>) => (
              <div key={d.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                <span className="text-sm font-medium">{d.title}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{d.stage}</Badge>
                  <span className="text-xs text-muted-foreground">{formatCurrency(d.value as number)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Activities */}
      <Section title="Recent Activities">
        {activities.length === 0 ? <EmptyText>No activities</EmptyText> : (
          <div className="space-y-1">
            {activities.slice(0, 10).map((a: Record<string, string>) => (
              <div key={a.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                <div>
                  <Badge variant="secondary" className="mr-2 text-xs">{a.type}</Badge>
                  <span className="text-sm">{a.subject}</span>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Tickets */}
      <Section title="Tickets">
        {tickets.length === 0 ? <EmptyText>No tickets</EmptyText> : (
          <div className="space-y-1">
            {tickets.map((t: Record<string, string>) => (
              <div key={t.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                <span className="text-sm">{t.subject}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={t.priority === 'critical' ? 'destructive' : 'secondary'}>{t.priority}</Badge>
                  <Badge variant="secondary">{t.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <p className="text-sm font-medium text-foreground mb-3">{title}</p>
      {children}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="border border-border rounded-lg p-3 bg-card flex items-center gap-3">
      <div className="p-2 bg-muted rounded">{icon}</div>
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold">{value}</p></div>
    </div>
  )
}

function HealthBadge({ score }: { score: number }) {
  const color = score > 70 ? 'bg-green-500/10 text-green-600' : score > 40 ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${color}`}>Health: {score}</span>
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground py-2">{children}</p>
}
