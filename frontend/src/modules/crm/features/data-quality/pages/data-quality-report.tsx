import { useNavigate } from 'react-router-dom'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { ShieldCheck, Copy, AlertCircle, Clock, ArrowRight } from 'lucide-react'
import { useDataQuality } from '../hooks/use-data-quality'

function QualityGauge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500'
  const bgColor = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
  const label = score >= 80 ? 'Good' : score >= 50 ? 'Needs Attention' : 'Critical'
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-muted">
        <div className={`absolute inset-0 rounded-full border-8 border-transparent ${bgColor}/20`} />
        <div className="text-center">
          <p className={`text-3xl font-bold ${color}`}>{score}</p>
          <p className="text-xs text-muted-foreground">/ 100</p>
        </div>
      </div>
      <p className={`text-sm font-medium ${color}`}>{label}</p>
    </div>
  )
}

interface SectionCardProps {
  icon: React.ReactNode
  title: string
  count: number
  description: string
  actionLabel: string
  onAction: () => void
  danger?: boolean
}

function SectionCard({ icon, title, count, description, actionLabel, onAction, danger }: SectionCardProps) {
  const countColor = count > 0 ? (danger ? 'text-red-500' : 'text-amber-500') : 'text-emerald-500'
  return (
    <div className="border border-border rounded-lg p-4 bg-card flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className={`text-2xl font-bold ${countColor}`}>{count}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {count > 0 && (
        <button
          onClick={onAction}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors self-start"
        >
          {actionLabel}
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
      {count === 0 && (
        <p className="text-xs text-emerald-500">No issues found</p>
      )}
    </div>
  )
}

export default function DataQualityReportPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const { data, isLoading, isError } = useDataQuality(workspaceId)
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-7 w-48 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <div key={i} className="h-36 bg-muted animate-pulse rounded-lg" />)}
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-6 flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        Failed to load data quality report. Admin access required.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-semibold text-foreground">Data Quality Report</h2>
          <p className="text-sm text-muted-foreground">Review and fix CRM data issues</p>
        </div>
      </div>

      {/* Score card */}
      <div className="border border-border rounded-lg p-6 bg-card flex items-center gap-8">
        <QualityGauge score={data.quality_score} />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Overall Quality Score</p>
          <p className="text-xs text-muted-foreground">
            Score is reduced by 2 points per identified issue across all categories.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-3 text-center">
            <div>
              <p className="text-lg font-bold text-foreground">{data.duplicate_count}</p>
              <p className="text-xs text-muted-foreground">Duplicates</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{data.missing_fields_count}</p>
              <p className="text-xs text-muted-foreground">Missing Fields</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{data.stale_records_count}</p>
              <p className="text-xs text-muted-foreground">Stale Records</p>
            </div>
          </div>
        </div>
      </div>

      {/* Issue sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SectionCard
          icon={<Copy className="h-4 w-4" />}
          title="Duplicates"
          count={data.duplicate_count}
          description={`${data.duplicate_email_count} duplicate emails, ${data.duplicate_phone_count} duplicate phones`}
          actionLabel="View Leads"
          onAction={() => navigate('/crm/leads')}
          danger
        />
        <SectionCard
          icon={<AlertCircle className="h-4 w-4" />}
          title="Missing Fields"
          count={data.missing_fields_count}
          description={`${data.incomplete_leads} leads missing contact info, ${data.ownerless_deals} deals without owner`}
          actionLabel="View Leads"
          onAction={() => navigate('/crm/leads')}
        />
        <SectionCard
          icon={<Clock className="h-4 w-4" />}
          title="Stale Records"
          count={data.stale_records_count}
          description="Contacts with no activity in the last 90 days"
          actionLabel="View Contacts"
          onAction={() => navigate('/crm/contacts')}
        />
      </div>
    </div>
  )
}
