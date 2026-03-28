import { useState } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { formatPrice, formatDuration } from '@/lib/utils'
import { useMenus, useUpdateMenu, useDeleteMenu } from '../hooks/useMenus'
import { MenuFormModal } from '../components/MenuFormModal'
import type { Menu } from '@/types/models'

export default function MenuManagePage() {
  const { data: menus, isLoading } = useMenus()
  const updateMenu = useUpdateMenu()
  const deleteMenu = useDeleteMenu()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)

  function handleCreate() {
    setEditingMenu(null)
    setModalOpen(true)
  }

  function handleEdit(menu: Menu) {
    setEditingMenu(menu)
    setModalOpen(true)
  }

  function handleDelete(menu: Menu) {
    if (!window.confirm(`「${menu.name}」を削除しますか？この操作は取り消せません。`)) return
    deleteMenu.mutate(menu.id)
  }

  function handleTogglePublic(menu: Menu) {
    updateMenu.mutate({ id: menu.id, is_public: !menu.is_public })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">メニュー管理</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          新しいメニュー
        </Button>
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm text-gray-500">全{menus?.length ?? 0}件</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">メニュー名</th>
                  <th className="px-4 py-3 font-medium">カテゴリ</th>
                  <th className="px-4 py-3 font-medium text-right">料金</th>
                  <th className="px-4 py-3 font-medium text-right">所要時間</th>
                  <th className="px-4 py-3 font-medium text-center">公開</th>
                  <th className="px-4 py-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {menus?.map((menu) => (
                  <tr key={menu.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{menu.name}</td>
                    <td className="px-4 py-3">
                      <Badge className="bg-primary-50 text-primary-700">{menu.category}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatPrice(menu.price)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatDuration(menu.duration_min)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleTogglePublic(menu)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          menu.is_public ? 'bg-primary-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                            menu.is_public ? 'translate-x-4.5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(menu)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="編集"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(menu)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          title="削除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {menus?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      メニューがまだ登録されていません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <MenuFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} menu={editingMenu} />
    </div>
  )
}
