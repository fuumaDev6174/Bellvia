import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Store } from '@/types/models'

export function useStoreBySlug(slug: string | undefined) {
  return useQuery<Store>({
    queryKey: ['store', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Store slug is required')
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!slug,
  })
}
