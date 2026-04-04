import { create } from 'zustand'
import type { StaffRole } from '@/types/models'

interface UIState {
  selectedStoreId: string | null
  sidebarOpen: boolean
  roleOverride: StaffRole | null
  setSelectedStoreId: (id: string | null) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setRoleOverride: (role: StaffRole | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedStoreId: null,
  sidebarOpen: true,
  roleOverride: null,
  setSelectedStoreId: (selectedStoreId) => set({ selectedStoreId }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setRoleOverride: (roleOverride) => set({ roleOverride }),
}))
