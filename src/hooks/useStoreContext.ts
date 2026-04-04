import { useUIStore } from '@/stores/uiStore'
import { useCurrentStaff } from './useCurrentStaff'

export function useStoreContext() {
  const { selectedStoreId, setSelectedStoreId, overrideStoreId } = useUIStore()
  const { storeId, isAdmin, isOverriding } = useCurrentStaff()

  // When overriding role, lock to the override store
  if (isOverriding && overrideStoreId) {
    return {
      activeStoreId: overrideStoreId,
      setSelectedStoreId: undefined,
      canSwitchStore: false,
    }
  }

  // company_admin can switch stores; others are locked to their store
  const activeStoreId = isAdmin ? (selectedStoreId ?? storeId) : storeId

  return {
    activeStoreId,
    setSelectedStoreId: isAdmin ? setSelectedStoreId : undefined,
    canSwitchStore: isAdmin,
  }
}
