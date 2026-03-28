import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
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
    queryFn: async () => {
      if (!storeId || !date || !menuId) return []
      const params: Record<string, string> = {
        p_store_id: storeId,
        p_date: date,
        p_menu_id: menuId,
      }
      if (staffId) params.p_staff_id = staffId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_available_slots', params)
      if (error) throw error
      return (data as AvailableSlot[]) ?? []
    },
    enabled: !!storeId && !!date && !!menuId,
    staleTime: 30 * 1000,
  })
}
