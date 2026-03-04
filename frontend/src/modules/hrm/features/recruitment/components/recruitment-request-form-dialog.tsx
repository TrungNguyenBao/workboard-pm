import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { useAuthStore } from '@/stores/auth.store'
import { useCreateRecruitmentRequest } from '../hooks/use-recruitment-requests'
import { useDepartments } from '../../departments/hooks/use-departments'
import { usePositions } from '../../positions/hooks/use-positions'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
}

export function RecruitmentRequestFormDialog({ open, onOpenChange, workspaceId }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <FormContent workspaceId={workspaceId} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function FormContent({ workspaceId, onOpenChange }: Omit<Props, 'open'>) {
  const user = useAuthStore((s) => s.user)
  const createRequest = useCreateRecruitmentRequest(workspaceId)
  const { data: deptData } = useDepartments(workspaceId, { page_size: 100 })
  const { data: posData } = usePositions(workspaceId, { page_size: 100 })

  const [title, setTitle] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [positionId, setPositionId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [reason, setReason] = useState('')
  const [requirements, setRequirements] = useState('')
  const [deadline, setDeadline] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !departmentId || !reason || !user) return
    try {
      await createRequest.mutateAsync({
        title,
        department_id: departmentId,
        position_id: positionId || null,
        quantity: parseInt(quantity) || 1,
        reason,
        requirements: requirements || null,
        deadline: deadline || null,
        requester_id: user.id,
      })
      toast({ title: 'Recruitment request created', variant: 'success' })
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to create recruitment request', variant: 'error' })
    }
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>New Recruitment Request</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="rr-title">Job Title *</Label>
          <Input id="rr-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Engineer" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Department *</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
              <SelectContent>
                {(deptData?.items ?? []).map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Position</Label>
            <Select value={positionId} onValueChange={setPositionId}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>
                {(posData?.items ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="rr-qty">Quantity</Label>
            <Input id="rr-qty" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rr-deadline">Deadline</Label>
            <Input id="rr-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rr-reason">Reason *</Label>
          <Input id="rr-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this role needed?" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rr-reqs">Requirements</Label>
          <textarea
            id="rr-reqs"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-20 outline-none focus:ring-2 focus:ring-ring"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Skills, experience, qualifications..."
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={createRequest.isPending || !title || !departmentId || !reason}>
            {createRequest.isPending ? 'Creating...' : 'Create Request'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
