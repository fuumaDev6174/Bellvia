import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { useStoreContext } from '@/hooks/useStoreContext'
import { useCurrentStaff } from '@/hooks/useCurrentStaff'
import type { Menu, MenuInsert, MenuUpdate } from '@/types/models'

export function useMenus() {
  const { activeStoreId } = useStoreContext()

  return useQuery<Menu[]>({
    queryKey: ['admin-menus', activeStoreId],
    queryFn: async () => {
      if (!activeStoreId) throw new Error('店舗が選択されていません')
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .eq('store_id', activeStoreId)
        .order('sort_order')
      if (error) throw error
      return data
    },
    enabled: !!activeStoreId,
  })
}

export function useCreateMenu() {
  const { activeStoreId } = useStoreContext()
  const { companyId } = useCurrentStaff()

  return useMutation({
    mutationFn: async (input: Omit<MenuInsert, 'store_id' | 'company_id'>) => {
      if (!activeStoreId || !companyId) throw new Error('店舗情報が取得できません')
      const { data, error } = await supabase
        .from('menus')
        .insert({ ...input, store_id: activeStoreId, company_id: companyId } as never)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menus', activeStoreId] })
      toast.success('メニューを作成しました')
    },
    onError: () => {
      toast.error('メニューの作成に失敗しました')
    },
  })
}

export function useUpdateMenu() {
  const { activeStoreId } = useStoreContext()

  return useMutation({
    mutationFn: async ({ id, ...input }: MenuUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('menus')
        .update(input as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menus', activeStoreId] })
      toast.success('メニューを更新しました')
    },
    onError: () => {
      toast.error('メニューの更新に失敗しました')
    },
  })
}

export function useDeleteMenu() {
  const { activeStoreId } = useStoreContext()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('menus').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menus', activeStoreId] })
      toast.success('メニューを削除しました')
    },
    onError: () => {
      toast.error('メニューの削除に失敗しました')
    },
  })
}
