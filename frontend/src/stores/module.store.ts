import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ModuleId = 'pms' | 'wms' | 'hrm' | 'crm'

interface ModuleInfo {
  id: ModuleId
  name: string
  description: string
  icon: string
  path: string
}

export const MODULES: ModuleInfo[] = [
  { id: 'pms', name: 'Projects', description: 'Project Management', icon: 'ClipboardList', path: '/pms' },
  { id: 'wms', name: 'Warehouse', description: 'Warehouse Management', icon: 'Warehouse', path: '/wms' },
  { id: 'hrm', name: 'People', description: 'Human Resources', icon: 'Users', path: '/hrm' },
  { id: 'crm', name: 'Sales', description: 'Customer Relations', icon: 'Handshake', path: '/crm' },
]

interface ModuleState {
  activeModule: ModuleId
  setActiveModule: (id: ModuleId) => void
}

export const useModuleStore = create<ModuleState>()(
  persist(
    (set) => ({
      activeModule: 'pms',
      setActiveModule: (id) => set({ activeModule: id }),
    }),
    { name: 'a-erp-module' },
  ),
)
