/** Shared chart color palette aligned with enterprise design system (blue-primary) */
export const CHART_COLORS = {
  // Semantic
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#0EA5E9',
  muted: '#94A3B8',

  // Priority
  priorityHigh: '#DC2626',
  priorityMedium: '#D97706',
  priorityLow: '#0EA5E9',
  priorityNone: '#94A3B8',

  // Sequential palette for multi-series charts
  series: [
    '#2563EB', // blue-600
    '#7C3AED', // violet-600
    '#D97706', // amber-600
    '#16A34A', // green-600
    '#DC2626', // red-600
    '#0EA5E9', // sky-500
    '#94A3B8', // slate-400
    '#DB2777', // pink-600
  ],
} as const

/** Recharts grid styling — use spread: <CartesianGrid {...CHART_GRID_STYLE} /> */
export const CHART_GRID_STYLE = {
  strokeDasharray: '3 3',
  stroke: '#E2E8F0',
  strokeOpacity: 0.8,
  vertical: false as const,
}

/** Recharts axis tick styling — use as prop: tick={CHART_AXIS_STYLE} */
export const CHART_AXIS_STYLE = {
  fontSize: 12,
  fill: '#64748B', // slate-500
} as const
