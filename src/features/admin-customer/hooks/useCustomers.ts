import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Customer } from '@/types/models'

export function useCustomers(search?: string, storeId?: string | null) {
  return useQuery<Customer[]>({
    queryKey: ['admin-customers', search, storeId],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search && search.trim()) params.set('search', search.trim())
      if (storeId) params.set('storeId', storeId)
      return api<Customer[]>(`/api/admin/customers?${params}`)
    },
  })
}
