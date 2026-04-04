import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Customer } from '@/types/models'

export function useCustomers(search?: string) {
  return useQuery<Customer[]>({
    queryKey: ['admin-customers', search],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search && search.trim()) params.set('search', search.trim())
      return api<Customer[]>(`/api/admin/customers?${params}`)
    },
  })
}
