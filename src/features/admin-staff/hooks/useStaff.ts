import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { useStoreContext } from '@/hooks/useStoreContext'
import type { Staff, StaffUpdate } from '@/types/models'

export function useStaff() {
  const { activeStoreId } = useStoreContext()

  return useQuery<Staff[]>({
    queryKey: ['admin-staff', activeStoreId],
    queryFn: async () => {
      if (!activeStoreId) throw new Error('店舗が選択されていません')
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('store_id', activeStoreId)
        .order('sort_order')
      if (error) throw error
      return data
    },
    enabled: !!activeStoreId,
  })
}

export function useUpdateStaff() {
  const { activeStoreId } = useStoreContext()

  return useMutation({
    mutationFn: async ({ id, ...input }: StaffUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('staff')
        .update(input as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff', activeStoreId] })
      toast.success('スタッフ情報を更新しました')
    },
    onError: () => {
      toast.error('スタッフ情報の更新に失敗しました')
    },
  })
}
