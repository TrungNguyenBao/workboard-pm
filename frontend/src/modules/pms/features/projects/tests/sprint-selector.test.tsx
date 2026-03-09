import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SprintSelector } from '../components/sprint-selector'

// Mock the hooks
vi.mock('../hooks/use-sprints', () => ({
  useSprints: () => ({
    data: [
      {
        id: 'sprint-1',
        name: 'Sprint 1',
        status: 'active',
        project_id: 'proj-1',
        goal: null,
        start_date: '2026-03-01',
        end_date: '2026-03-15',
        created_by_id: 'user-1',
        created_at: '2026-03-01',
        updated_at: '2026-03-01',
        task_count: 5,
        completed_points: 8,
        total_points: 21,
      },
      {
        id: 'sprint-2',
        name: 'Sprint 2',
        status: 'planning',
        project_id: 'proj-1',
        goal: null,
        start_date: null,
        end_date: null,
        created_by_id: 'user-1',
        created_at: '2026-03-01',
        updated_at: '2026-03-01',
        task_count: 0,
        completed_points: 0,
        total_points: 0,
      },
    ],
  }),
  useCreateSprint: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useStartSprint: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useCompleteSprint: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useActiveSprint: () => null,
}))

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('SprintSelector', () => {
  it('renders with Backlog label when no sprint selected', () => {
    render(
      <SprintSelector projectId="proj-1" selectedSprintId={null} onSelect={vi.fn()} />,
      { wrapper },
    )
    expect(screen.getByText('Backlog')).toBeInTheDocument()
  })

  it('renders with sprint name when sprint selected', () => {
    render(
      <SprintSelector projectId="proj-1" selectedSprintId="sprint-1" onSelect={vi.fn()} />,
      { wrapper },
    )
    expect(screen.getByText('Sprint 1')).toBeInTheDocument()
  })

  it('shows Sprint: label', () => {
    render(
      <SprintSelector projectId="proj-1" selectedSprintId={null} onSelect={vi.fn()} />,
      { wrapper },
    )
    expect(screen.getByText('Sprint:')).toBeInTheDocument()
  })
})
