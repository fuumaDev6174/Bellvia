import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Staff } from '@/types/models'

export function usePublicStylists(storeId: string | undefined) {
  return useQuery<Staff[]>({
    queryKey: ['public-stylists', storeId],
    queryFn: () => api<Staff[]>(`/api/public/stores/${storeId}/stylists`),
    enabled: !!storeId,
  })
}
