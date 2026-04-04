import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import type { StaffRole } from '@/types/models'

export function useCurrentStaff() {
  const { currentStaff, isLoading } = useAuthStore()
  const roleOverride = useUIStore((s) => s.roleOverride)

  const actualRole = currentStaff?.role as StaffRole | undefined
  // Only company_admin can use role override, and only to lower roles
  const role = (actualRole === 'company_admin' && roleOverride) ? roleOverride : actualRole

  const isAdmin = role === 'company_admin'
  const isManager = role === 'store_manager'
  const canManageStore = isAdmin || isManager

  return {
    staff: currentStaff,
    role,
    actualRole,
    isAdmin,
    isManager,
    canManageStore,
    isLoading,
    isOverriding: actualRole === 'company_admin' && roleOverride !== null,
    companyId: currentStaff?.company_id ?? null,
    storeId: currentStaff?.store_id ?? null,
  }
}
