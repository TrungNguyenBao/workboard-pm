import { Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface PanelProps {
  candidateId: string
  workspaceId: string
  interviews: Array<{ id: string; scheduled_at: string; status: string; score: number | null; feedback: string | null }>
  offers: Array<{ id: string; position_title: string; offered_salary: string; status: string; start_date: string }>
  onScheduleInterview: () => void
  onMakeOffer: () => void
  onFeedback: (id: string) => void
  onUpdateStatus: (s: string) => void
  onSendOffer: (id: string) => void
  onAcceptOffer: (id: string) => void
  onRejectOffer: (id: string) => void
}

/** Detail panel for a selected candidate: status actions, interviews, and offers. */
export function CandidateDetailPanel({
  interviews, offers, onScheduleInterview, onMakeOffer, onFeedback,
  onUpdateStatus, onSendOffer, onAcceptOffer, onRejectOffer,
}: PanelProps) {
  return (
    <div className="space-y-6">
      {/* Pipeline stage quick-move */}
      <div className="flex flex-wrap gap-2">
        {['screening', 'interviewing', 'offered', 'hired', 'rejected'].map((s) => (
          <Button key={s} size="sm" variant="outline" className="h-7 text-xs capitalize" onClick={() => onUpdateStatus(s)}>
            Move to {s}
          </Button>
        ))}
      </div>

      {/* Interviews */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Interviews</h3>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onScheduleInterview}>
            <Plus className="h-3 w-3 mr-1" /> Schedule
          </Button>
        </div>
        {interviews.length === 0 ? (
          <p className="text-xs text-muted-foreground">No interviews scheduled</p>
        ) : (
          <div className="space-y-2">
            {interviews.map((iv) => (
              <div key={iv.id} className="flex items-center justify-between p-3 rounded-md border border-border text-sm">
                <div>
                  <p>{new Date(iv.scheduled_at).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Status: {iv.status}{iv.score ? ` · Score: ${iv.score}/5` : ''}
                  </p>
                </div>
                {iv.status === 'scheduled' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onFeedback(iv.id)}>
                    Complete
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Offers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Offers</h3>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onMakeOffer}>
            <Plus className="h-3 w-3 mr-1" /> Make Offer
          </Button>
        </div>
        {offers.length === 0 ? (
          <p className="text-xs text-muted-foreground">No offers made</p>
        ) : (
          <div className="space-y-2">
            {offers.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-md border border-border text-sm">
                <div>
                  <p className="font-medium">{o.position_title}</p>
                  <p className="text-xs text-muted-foreground">
                    ${Number(o.offered_salary).toLocaleString()} · Start: {o.start_date} · {o.status}
                  </p>
                </div>
                <div className="flex gap-1">
                  {o.status === 'draft' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onSendOffer(o.id)}>Send</Button>
                  )}
                  {o.status === 'sent' && (
                    <>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-green-600" onClick={() => onAcceptOffer(o.id)}>Accept</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => onRejectOffer(o.id)}>Reject</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
