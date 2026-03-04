import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { toast } from '@/shared/components/ui/toast'
import { useRecruitmentRequest } from '../hooks/use-recruitment-requests'
import { useCandidates, useUpdateCandidateStatus } from '../hooks/use-candidates'
import { useInterviews } from '../hooks/use-interviews'
import { useOffers, useSendOffer, useAcceptOffer, useRejectOffer } from '../hooks/use-offers'
import { CandidateStatusBadge } from '../components/candidate-status-badge'
import { CandidateFormDialog } from '../components/candidate-form-dialog'
import { InterviewFormDialog } from '../components/interview-form-dialog'
import { InterviewFeedbackDialog } from '../components/interview-feedback-dialog'
import { OfferFormDialog } from '../components/offer-form-dialog'

export default function RecruitmentDetailPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''

  const { data: request } = useRecruitmentRequest(workspaceId, requestId ?? '')
  const { data: candidatesData } = useCandidates(workspaceId, { recruitment_request_id: requestId })

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [candidateDialogOpen, setCandidateDialogOpen] = useState(false)
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false)
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
  const [offerDialogOpen, setOfferDialogOpen] = useState(false)
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null)

  const updateStatus = useUpdateCandidateStatus(workspaceId)
  const sendOffer = useSendOffer(workspaceId)
  const acceptOffer = useAcceptOffer(workspaceId)
  const rejectOffer = useRejectOffer(workspaceId)

  const { data: interviewsData } = useInterviews(workspaceId, {
    candidate_id: selectedCandidateId ?? undefined,
  })
  const { data: offersData } = useOffers(workspaceId, {
    candidate_id: selectedCandidateId ?? undefined,
  })

  if (!request) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <button onClick={() => navigate('/hrm/recruitment')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold">{request.title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{request.reason}</p>
        </div>
        <Badge variant="outline">{request.status}</Badge>
        <span className="text-xs text-muted-foreground">Qty: {request.quantity}</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Candidates panel */}
        <div className="w-72 border-r border-border flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-medium">Candidates</span>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setCandidateDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {(candidatesData?.items ?? []).length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground">No candidates yet</p>
            ) : (
              (candidatesData?.items ?? []).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCandidateId(c.id)}
                  className={`w-full text-left px-4 py-3 border-b border-border hover:bg-accent transition-colors ${selectedCandidateId === c.id ? 'bg-primary/5' : ''}`}
                >
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  <div className="mt-1"><CandidateStatusBadge status={c.status} /></div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          {!selectedCandidateId ? (
            <div className="text-sm text-muted-foreground">Select a candidate to view details</div>
          ) : (
            <CandidateDetailPanel
              candidateId={selectedCandidateId}
              workspaceId={workspaceId}
              interviews={interviewsData?.items ?? []}
              offers={offersData?.items ?? []}
              onScheduleInterview={() => setInterviewDialogOpen(true)}
              onMakeOffer={() => setOfferDialogOpen(true)}
              onFeedback={(ivId) => { setSelectedInterviewId(ivId); setFeedbackDialogOpen(true) }}
              onUpdateStatus={async (status) => {
                await updateStatus.mutateAsync({ candidateId: selectedCandidateId, new_status: status })
                toast({ title: 'Status updated', variant: 'success' })
              }}
              onSendOffer={async (offerId) => {
                await sendOffer.mutateAsync(offerId)
                toast({ title: 'Offer sent', variant: 'success' })
              }}
              onAcceptOffer={async (offerId) => {
                await acceptOffer.mutateAsync(offerId)
                toast({ title: 'Offer accepted', variant: 'success' })
              }}
              onRejectOffer={async (offerId) => {
                await rejectOffer.mutateAsync(offerId)
                toast({ title: 'Offer rejected', variant: 'success' })
              }}
            />
          )}
        </div>
      </div>

      <CandidateFormDialog
        open={candidateDialogOpen}
        onOpenChange={setCandidateDialogOpen}
        workspaceId={workspaceId}
        recruitmentRequestId={requestId ?? ''}
      />
      {selectedCandidateId && (
        <>
          <InterviewFormDialog
            open={interviewDialogOpen}
            onOpenChange={setInterviewDialogOpen}
            workspaceId={workspaceId}
            candidateId={selectedCandidateId}
          />
          <OfferFormDialog
            open={offerDialogOpen}
            onOpenChange={setOfferDialogOpen}
            workspaceId={workspaceId}
            candidateId={selectedCandidateId}
          />
          {selectedInterviewId && (
            <InterviewFeedbackDialog
              open={feedbackDialogOpen}
              onOpenChange={setFeedbackDialogOpen}
              workspaceId={workspaceId}
              interviewId={selectedInterviewId}
            />
          )}
        </>
      )}
    </div>
  )
}

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

function CandidateDetailPanel({
  interviews, offers, onScheduleInterview, onMakeOffer, onFeedback,
  onUpdateStatus, onSendOffer, onAcceptOffer, onRejectOffer,
}: PanelProps) {
  return (
    <div className="space-y-6">
      {/* Pipeline actions */}
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
