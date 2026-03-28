import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Staff } from '@/types/models'

export function usePublicStylists(storeId: string | undefined) {
  return useQuery<Staff[]>({
    queryKey: ['public-stylists', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID required')
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('sort_order')
      if (error) throw error
      return data
    },
    enabled: !!storeId,
  })
}
