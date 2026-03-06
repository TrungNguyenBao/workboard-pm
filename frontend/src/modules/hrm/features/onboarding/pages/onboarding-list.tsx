import { useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { PageHeader } from '@/shared/components/ui/page-header'
import { OnboardingChecklistItem } from '../components/onboarding-checklist-item'
import { useOnboardingChecklists, useGenerateDefaultChecklist } from '../hooks/use-onboarding'
import { useEmployees } from '../../employees/hooks/use-employees'

export default function OnboardingListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [employeeFilter, setEmployeeFilter] = useState('all')

  const { data: empData } = useEmployees(workspaceId, { page_size: 100 })
  const { data } = useOnboardingChecklists(workspaceId, {
    employee_id: employeeFilter === 'all' ? undefined : employeeFilter,
    page_size: 200,
  })
  const generateChecklist = useGenerateDefaultChecklist(workspaceId)

  const items = data?.items ?? []
  const groups = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.employee_id]) acc[item.employee_id] = []
    acc[item.employee_id].push(item)
    return acc
  }, {})
  const empMap = new Map((empData?.items ?? []).map((e) => [e.id, e.name]))

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Onboarding"
        description="Track employee onboarding tasks"
      >
        <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
          <SelectTrigger className="w-44 h-8"><SelectValue placeholder="All employees" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All employees</SelectItem>
            {(empData?.items ?? []).map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {employeeFilter !== 'all' && (
          <Button size="sm" variant="outline" className="h-8"
            onClick={async () => {
              await generateChecklist.mutateAsync(employeeFilter)
              toast({ title: 'Default checklist generated', variant: 'success' })
            }}
            disabled={generateChecklist.isPending}
          >
            Generate Defaults
          </Button>
        )}
      </PageHeader>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {Object.keys(groups).length === 0 ? (
          <p className="text-sm text-muted-foreground">No onboarding tasks found</p>
        ) : (
          Object.entries(groups).map(([empId, empItems]) => {
            const completed = empItems.filter((i) => i.is_completed).length
            return (
              <div key={empId}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {empMap.get(empId) ?? 'Unknown Employee'}
                  </h3>
                  <span className="text-xs text-muted-foreground">{completed}/{empItems.length} completed</span>
                </div>
                {Array.from(new Set(empItems.map((i) => i.category ?? 'General'))).map((cat) => (
                  <div key={cat} className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 px-3">{cat}</p>
                    <div className="border border-border rounded-md overflow-hidden">
                      {empItems
                        .filter((i) => (i.category ?? 'General') === cat)
                        .map((item) => (
                          <OnboardingChecklistItem key={item.id} item={item} workspaceId={workspaceId} />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
