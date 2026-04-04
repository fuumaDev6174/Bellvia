import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Menu } from '@/types/models'

export function usePublicMenus(storeId: string | undefined) {
  return useQuery<Menu[]>({
    queryKey: ['public-menus', storeId],
    queryFn: () => api<Menu[]>(`/api/public/stores/${storeId}/menus`),
    enabled: !!storeId,
  })
}
