import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Badge } from '@/shared/components/ui/badge'
import { type Lead } from '../hooks/use-leads'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  newLead: Omit<Lead, 'id' | 'workspace_id' | 'created_at' | 'updated_at' | 'assigned_at' | 'contacted_at' | 'score' | 'owner_id' | 'campaign_id'>
  duplicates: Lead[]
  onMerge: (keepId: string) => void
  onCreateAnyway: () => void
  isPending?: boolean
}

function LeadField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium truncate">{value || <span className="text-muted-foreground italic">—</span>}</p>
    </div>
  )
}

export function LeadDuplicateModal({ open, onOpenChange, newLead, duplicates, onMerge, onCreateAnyway, isPending }: Props) {
  const primary = duplicates[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Potential Duplicate Detected</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {duplicates.length === 1
              ? 'A lead with the same email or phone already exists.'
              : `${duplicates.length} leads with matching email or phone already exist.`}
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-2">
          {/* Existing lead */}
          <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Existing Lead</p>
              <Badge variant="secondary">{primary.status}</Badge>
            </div>
            <LeadField label="Name" value={primary.name} />
            <LeadField label="Email" value={primary.email} />
            <LeadField label="Phone" value={primary.phone} />
            <LeadField label="Source" value={primary.source} />
            <LeadField label="Score" value={String(primary.score)} />
          </div>

          {/* New lead */}
          <div className="rounded-lg border p-4 space-y-3 border-primary/40 bg-primary/5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">New Lead</p>
              <Badge variant="outline">new</Badge>
            </div>
            <LeadField label="Name" value={newLead.name} />
            <LeadField label="Email" value={newLead.email} />
            <LeadField label="Phone" value={newLead.phone} />
            <LeadField label="Source" value={newLead.source} />
            <LeadField label="Score" value="—" />
          </div>
        </div>

        {duplicates.length > 1 && (
          <p className="text-xs text-muted-foreground mt-1">
            Merge will combine with the first match. {duplicates.length - 1} other duplicate(s) found.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="outline" onClick={onCreateAnyway} disabled={isPending}>
            Create Anyway
          </Button>
          <Button onClick={() => onMerge(primary.id)} disabled={isPending}>
            {isPending ? 'Merging...' : 'Merge with Existing'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
