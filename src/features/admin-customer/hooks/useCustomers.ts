import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentStaff } from '@/hooks/useCurrentStaff'
import type { Customer } from '@/types/models'

export function useCustomers(search?: string) {
  const { companyId } = useCurrentStaff()

  return useQuery<Customer[]>({
    queryKey: ['admin-customers', companyId, search],
    queryFn: async () => {
      if (!companyId) throw new Error('会社情報が取得できません')

      let query = supabase
        .from('customers')
        .select('*')
        .eq('company_id', companyId)
        .order('last_visit_at', { ascending: false, nullsFirst: false })

      if (search && search.trim()) {
        const term = `%${search.trim()}%`
        query = query.or(`name.ilike.${term},phone.ilike.${term}`)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!companyId,
  })
}
