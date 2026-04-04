import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AvailableSlot } from '@/types/models'

interface UseAvailableSlotsParams {
  storeId: string | undefined
  date: string | undefined
  menuId: string | undefined
  staffId?: string | null
}

export function useAvailableSlots({ storeId, date, menuId, staffId }: UseAvailableSlotsParams) {
  return useQuery<AvailableSlot[]>({
    queryKey: ['available-slots', storeId, date, menuId, staffId],
    queryFn: () => {
      const params = new URLSearchParams({ date: date!, menuId: menuId! })
      if (staffId) params.set('staffId', staffId)
      return api<AvailableSlot[]>(`/api/public/stores/${storeId}/available-slots?${params}`)
    },
    enabled: !!storeId && !!date && !!menuId,
    staleTime: 30 * 1000,
  })
}
