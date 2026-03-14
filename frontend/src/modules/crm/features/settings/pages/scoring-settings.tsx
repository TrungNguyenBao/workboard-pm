import { useEffect, useState } from 'react'
import { Star, Plus, Trash2, RotateCcw, Save, AlertCircle } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useScoringConfig, useUpdateScoringConfig, type ScoringRuleItem } from '../hooks/use-scoring-config'

const DEFAULT_RULES: ScoringRuleItem[] = [
  { activity_type: 'email_open', points: 5 },
  { activity_type: 'click', points: 10 },
  { activity_type: 'form_submit', points: 15 },
  { activity_type: 'call', points: 15 },
  { activity_type: 'demo', points: 20 },
  { activity_type: 'follow_up', points: 5 },
  { activity_type: 'meeting', points: 20 },
  { activity_type: 'note', points: 2 },
]

function toRules(activityScores: Record<string, number>): ScoringRuleItem[] {
  return Object.entries(activityScores).map(([activity_type, points]) => ({ activity_type, points }))
}

export default function ScoringSettingsPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const { data: config, isLoading, isError } = useScoringConfig(workspaceId)
  const updateConfig = useUpdateScoringConfig(workspaceId)

  const [rules, setRules] = useState<ScoringRuleItem[]>(DEFAULT_RULES)
  const [coldMax, setColdMax] = useState(30)
  const [warmMax, setWarmMax] = useState(60)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!config) return
    const loaded = toRules(config.rules.activity_scores ?? {})
    setRules(loaded.length ? loaded : DEFAULT_RULES)
    setColdMax(config.rules.thresholds?.cold_max ?? 30)
    setWarmMax(config.rules.thresholds?.warm_max ?? 60)
    setDirty(false)
  }, [config])

  function updateRule(index: number, field: keyof ScoringRuleItem, value: string | number) {
    setRules((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
    setDirty(true)
  }

  function addRule() {
    setRules((prev) => [...prev, { activity_type: '', points: 5 }])
    setDirty(true)
  }

  function removeRule(index: number) {
    setRules((prev) => prev.filter((_, i) => i !== index))
    setDirty(true)
  }

  function resetToDefaults() {
    setRules(DEFAULT_RULES)
    setColdMax(30)
    setWarmMax(60)
    setDirty(true)
  }

  function handleSave() {
    const validRules = rules.filter((r) => r.activity_type.trim())
    updateConfig.mutate(
      { rules: validRules, thresholds: { cold_max: coldMax, warm_max: warmMax } },
      { onSuccess: () => setDirty(false) },
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6 flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        Failed to load scoring config. Admin access required.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Star className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">Lead Scoring Rules</h2>
            <p className="text-sm text-muted-foreground">Configure points awarded per activity type</p>
          </div>
        </div>
        <button
          onClick={resetToDefaults}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to Defaults
        </button>
      </div>

      {/* Rules table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_36px] gap-0 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
          <span>Activity Type</span>
          <span className="text-right">Points</span>
          <span />
        </div>
        <div className="divide-y divide-border">
          {rules.map((rule, index) => (
            <div key={index} className="grid grid-cols-[1fr_100px_36px] items-center gap-0 px-4 py-2">
              <input
                className="bg-transparent text-sm text-foreground outline-none border-b border-transparent focus:border-primary transition-colors"
                value={rule.activity_type}
                placeholder="activity_type"
                onChange={(e) => updateRule(index, 'activity_type', e.target.value)}
              />
              <input
                type="number"
                min={0}
                max={100}
                className="bg-transparent text-sm text-right text-foreground outline-none border-b border-transparent focus:border-primary transition-colors w-full"
                value={rule.points}
                onChange={(e) => updateRule(index, 'points', Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
              />
              <div className="flex justify-end">
                <button
                  onClick={() => removeRule(index)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={addRule}
        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Rule
      </button>

      {/* Thresholds */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Score Thresholds</h3>
        <p className="text-xs text-muted-foreground">
          Leads are categorised as: Cold (0–cold_max), Warm (cold_max–warm_max), Hot (above warm_max)
        </p>

        {/* Visual threshold bands */}
        <div className="flex gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-medium">
            Cold: 0–{coldMax}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-medium">
            Warm: {coldMax + 1}–{warmMax}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-medium">
            Hot: {warmMax + 1}–100
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Cold Max</span>
            <input
              type="number"
              min={0}
              className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground outline-none focus:ring-1 focus:ring-primary"
              value={coldMax}
              onChange={(e) => { setColdMax(Number(e.target.value) || 0); setDirty(true) }}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Warm Max</span>
            <input
              type="number"
              min={0}
              className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground outline-none focus:ring-1 focus:ring-primary"
              value={warmMax}
              onChange={(e) => { setWarmMax(Number(e.target.value) || 0); setDirty(true) }}
            />
          </label>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!dirty || updateConfig.isPending}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Save className="h-4 w-4" />
        {updateConfig.isPending ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}
