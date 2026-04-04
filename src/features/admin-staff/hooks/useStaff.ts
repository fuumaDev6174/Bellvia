import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { useStoreContext } from '@/hooks/useStoreContext'
import type { Staff, StaffUpdate } from '@/types/models'

export function useStaff() {
  const { activeStoreId } = useStoreContext()

  return useQuery<Staff[]>({
    queryKey: ['admin-staff', activeStoreId],
    queryFn: () => api<Staff[]>(`/api/admin/staff?storeId=${activeStoreId}`),
    enabled: !!activeStoreId,
  })
}

export function useUpdateStaff() {
  const { activeStoreId } = useStoreContext()

  return useMutation({
    mutationFn: async ({ id, ...input }: StaffUpdate & { id: string }) =>
      api<Staff>(`/api/admin/staff/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: input.display_name,
          role: input.role,
          position: input.position,
          bio: input.bio,
          specialties: input.specialties,
          isActive: input.is_active,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff', activeStoreId] })
      toast.success('スタッフ情報を更新しました')
    },
    onError: () => {
      toast.error('スタッフ情報の更新に失敗しました')
    },
  })
}
