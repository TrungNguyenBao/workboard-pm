import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import BoardPage from '../pages/board'

// Mock the hooks
vi.mock('../hooks/use-project-tasks', () => ({
  useSections: () => ({
    data: [
      { id: 'sec-1', name: 'To Do', color: '#5E6AD2', position: 65536, project_id: 'proj-1' },
      { id: 'sec-2', name: 'In Progress', color: '#22C55E', position: 131072, project_id: 'proj-1' },
    ],
  }),
  useTasks: () => ({
    data: [
      { id: 'task-1', title: 'Buy milk', section_id: 'sec-1', status: 'incomplete', priority: 'none', position: 65536, project_id: 'proj-1', parent_id: null, assignee_id: null, created_by_id: 'u1', description: null, due_date: null, completed_at: null, created_at: '', updated_at: '' },
    ],
  }),
  useMoveTask: () => ({ mutate: vi.fn() }),
}))

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

function renderBoard() {
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/projects/proj-1/board']}>
        <Routes>
          <Route path="/projects/:projectId/board" element={<BoardPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('BoardPage', () => {
  it('renders section columns', () => {
    renderBoard()
    expect(screen.getByText('To Do')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('renders task cards', () => {
    renderBoard()
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })
})
