import { useAuthStore } from '@/stores/authStore'
import type { StaffRole } from '@/types/models'

export function useCurrentStaff() {
  const { currentStaff, isLoading } = useAuthStore()

  const role = currentStaff?.role as StaffRole | undefined
  const isAdmin = role === 'company_admin'
  const isManager = role === 'store_manager'
  const canManageStore = isAdmin || isManager

  return {
    staff: currentStaff,
    role,
    isAdmin,
    isManager,
    canManageStore,
    isLoading,
    companyId: currentStaff?.company_id ?? null,
    storeId: currentStaff?.store_id ?? null,
  }
}
