import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Store } from '@/types/models'

export function useStoreBySlug(slug: string | undefined) {
  return useQuery<Store>({
    queryKey: ['store', slug],
    queryFn: () => api<Store>(`/api/public/stores/${slug}`),
    enabled: !!slug,
  })
}
