import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { useStoreContext } from '@/hooks/useStoreContext'
import type { Menu, MenuUpdate } from '@/types/models'

export function useMenus() {
  const { activeStoreId } = useStoreContext()

  return useQuery<Menu[]>({
    queryKey: ['admin-menus', activeStoreId],
    queryFn: () => api<Menu[]>(`/api/admin/menus?storeId=${activeStoreId}`),
    enabled: !!activeStoreId,
  })
}

export function useCreateMenu() {
  const { activeStoreId } = useStoreContext()

  return useMutation({
    mutationFn: async (input: {
      name: string
      category?: string | null
      description?: string | null
      price: number
      duration_min: number
      is_public?: boolean
    }) =>
      api<Menu>('/api/admin/menus', {
        method: 'POST',
        body: JSON.stringify({
          name: input.name,
          category: input.category,
          description: input.description,
          price: input.price,
          durationMin: input.duration_min,
          isPublic: input.is_public,
        }),
      }),
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
    mutationFn: async ({ id, ...input }: MenuUpdate & { id: string }) =>
      api<Menu>(`/api/admin/menus/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: input.name,
          category: input.category,
          description: input.description,
          price: input.price,
          durationMin: input.duration_min,
          isPublic: input.is_public,
          sortOrder: input.sort_order,
        }),
      }),
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
    mutationFn: async (id: string) =>
      api(`/api/admin/menus/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menus', activeStoreId] })
      toast.success('メニューを削除しました')
    },
    onError: () => {
      toast.error('メニューの削除に失敗しました')
    },
  })
}
