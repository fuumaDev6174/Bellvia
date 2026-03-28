import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
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
    mutationFn: async (params) => {
      const rpcParams: Record<string, string> = {
        p_store_id: params.storeId,
        p_staff_id: params.staffId,
        p_menu_id: params.menuId,
        p_start_at: params.startAt,
        p_guest_name: params.guestName,
        p_guest_phone: params.guestPhone,
      }
      if (params.guestEmail) rpcParams.p_guest_email = params.guestEmail
      if (params.notes) rpcParams.p_notes = params.notes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('create_guest_reservation', rpcParams)
      if (error) throw error
      return data as GuestReservationResult
    },
  })
}
