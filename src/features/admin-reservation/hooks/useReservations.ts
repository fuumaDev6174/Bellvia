import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
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
    queryFn: () => {
      const params = new URLSearchParams()
      if (storeId) params.set('storeId', storeId)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (status) params.set('status', status)
      if (staffId) params.set('staffId', staffId)
      return api<ReservationWithDetails[]>(`/api/admin/reservations?${params}`)
    },
    enabled: !!storeId,
  })
}
