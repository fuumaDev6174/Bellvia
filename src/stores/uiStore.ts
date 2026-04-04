import { create } from 'zustand'
import type { StaffRole } from '@/types/models'

interface UIState {
  selectedStoreId: string | null
  sidebarOpen: boolean
  roleOverride: StaffRole | null
  overrideStoreId: string | null
  setSelectedStoreId: (id: string | null) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setRoleOverride: (role: StaffRole | null, storeId?: string | null) => void
  clearOverride: () => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedStoreId: null,
  sidebarOpen: true,
  roleOverride: null,
  overrideStoreId: null,
  setSelectedStoreId: (selectedStoreId) => set({ selectedStoreId }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setRoleOverride: (roleOverride, storeId) => set({
    roleOverride,
    overrideStoreId: storeId ?? null,
  }),
  clearOverride: () => set({ roleOverride: null, overrideStoreId: null }),
}))
