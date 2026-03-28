import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Menu } from '@/types/models'

export function usePublicMenus(storeId: string | undefined) {
  return useQuery<Menu[]>({
    queryKey: ['public-menus', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID required')
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_public', true)
        .order('sort_order')
      if (error) throw error
      return data
    },
    enabled: !!storeId,
  })
}
