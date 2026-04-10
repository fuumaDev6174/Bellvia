import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useStoreContext } from '@/hooks/useStoreContext'

export interface WorkloadEntry {
  staffId: string
  staffName: string
  totalPoints: number
  totalCount: number
  byMenu: Record<string, { count: number; points: number }>
}

export function useWorkload(startDate: string, endDate: string, staffId?: string) {
  const { activeStoreId } = useStoreContext()

  return useQuery<WorkloadEntry[]>({
    queryKey: ['admin-workload', activeStoreId, startDate, endDate, staffId],
    queryFn: () => {
      const params = new URLSearchParams()
      if (activeStoreId) params.set('storeId', activeStoreId)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (staffId) params.set('staffId', staffId)
      return api<WorkloadEntry[]>(`/api/admin/workload?${params}`)
    },
    enabled: !!activeStoreId,
  })
}
