import { useUIStore } from '@/stores/uiStore'
import { useCurrentStaff } from './useCurrentStaff'

export function useStoreContext() {
  const { selectedStoreId, setSelectedStoreId } = useUIStore()
  const { storeId, isAdmin } = useCurrentStaff()

  // company_admin can switch stores; others are locked to their store
  const activeStoreId = isAdmin ? (selectedStoreId ?? storeId) : storeId

  return {
    activeStoreId,
    setSelectedStoreId: isAdmin ? setSelectedStoreId : undefined,
    canSwitchStore: isAdmin,
  }
}
