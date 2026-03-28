import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ReservationWithDetails, ReservationStatus } from '@/types/models'

interface UseReservationsParams {
  storeId: string | null
  startDate?: string
  endDate?: string
  status?: ReservationStatus
  staffId?: string
}

export function useReservations({
  storeId,
  startDate,
  endDate,
  status,
  staffId,
}: UseReservationsParams) {
  return useQuery<ReservationWithDetails[]>({
    queryKey: ['reservations', storeId, startDate, endDate, status, staffId],
    queryFn: async () => {
      if (!storeId) return []

      let query = supabase
        .from('reservations')
        .select(
          `
          *,
          staff:staff_id (display_name, photo_url),
          menu:menu_id (name, price, duration_min, category),
          customer:customer_id (name, phone, email)
        `,
        )
        .eq('store_id', storeId)
        .order('start_at', { ascending: true })

      if (startDate) {
        query = query.gte('start_at', `${startDate}T00:00:00`)
      }
      if (endDate) {
        query = query.lte('start_at', `${endDate}T23:59:59`)
      }
      if (status) {
        query = query.eq('status', status)
      }
      if (staffId) {
        query = query.eq('staff_id', staffId)
      }

      const { data, error } = await query

      if (error) throw error
      return (data as unknown as ReservationWithDetails[]) ?? []
    },
    enabled: !!storeId,
  })
}
