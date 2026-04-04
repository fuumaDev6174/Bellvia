import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { GuestReservationResult } from '@/types/models'

interface CreateReservationParams {
  storeId: string
  staffId: string
  menuId: string
  startAt: string
  guestName: string
  guestPhone: string
  guestEmail?: string
  notes?: string
}

export function useCreateReservation() {
  return useMutation<GuestReservationResult, Error, CreateReservationParams>({
    mutationFn: (params) =>
      api<GuestReservationResult>('/api/public/reservations', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  })
}
