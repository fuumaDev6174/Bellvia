import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { Card, CardContent, CardHeader, Button, Input, Spinner, Badge } from '@/components/ui'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'

interface BusinessType {
  id: string
  name: string
  color: string
  sort_order: number
  is_active: boolean
}

const PRESET_COLORS = [
  '#ec4899', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981',
  '#f43f5e', '#3b82f6', '#6366f1', '#84cc16', '#6b7280',
]

export default function BusinessTypeManagePage() {
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const { data: types, isLoading } = useQuery<BusinessType[]>({
    queryKey: ['business-types'],
    queryFn: () => api<BusinessType[]>('/api/admin/business-types'),
  })

  const createMutation = useMutation({
    mutationFn: (body: { name: string; color: string }) =>
      api('/api/admin/business-types', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-types'] })
      toast.success('業種を追加しました')
      setIsAdding(false)
      setNewName('')
      setNewColor(PRESET_COLORS[0])
    },
    onError: () => toast.error('追加に失敗しました'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: string; name?: string; color?: string; isActive?: boolean }) =>
      api(`/api/admin/business-types/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-types'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] })
      toast.success('更新しました')
      setEditingId(null)
    },
    onError: () => toast.error('更新に失敗しました'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/api/admin/business-types/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-types'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] })
      toast.success('削除しました')
    },
    onError: () => toast.error('削除に失敗しました'),
  })

  const handleCreate = () => {
    if (!newName.trim()) {
      toast.error('業種名を入力してください')
      return
    }
    createMutation.mutate({ name: newName.trim(), color: newColor })
  }

  const handleUpdate = (id: string) => {
    if (!editName.trim()) {
      toast.error('業種名を入力してください')
      return
    }
    updateMutation.mutate({ id, name: editName.trim(), color: editColor })
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？紐付いている店舗の業種は未設定になります。`)) return
    deleteMutation.mutate(id)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">業種管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            店舗に割り当てる業種カテゴリを管理します
          </p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="mr-1 h-4 w-4" />
            追加
          </Button>
        )}
      </div>

      {/* Add form */}
      {isAdding && (
        <Card>
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-gray-900">新しい業種を追加</h3>
            <Input
              label="業種名"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例: 美容サロン"
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">カラー</label>
              <div className="flex gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`h-8 w-8 rounded-full border-2 transition-transform ${
                      newColor === c ? 'scale-110 border-gray-900' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} loading={createMutation.isPending}>
                追加
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">登録済み業種</h2>
        </CardHeader>
        <div className="divide-y">
          {types?.map((t) => {
            const isEditing = editingId === t.id
            return (
              <div key={t.id} className="flex items-center gap-4 px-6 py-4">
                {isEditing ? (
                  <>
                    <div className="flex gap-2">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setEditColor(c)}
                          className={`h-6 w-6 rounded-full border-2 ${
                            editColor === c ? 'border-gray-900' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="max-w-xs"
                    />
                    <div className="ml-auto flex gap-2">
                      <button
                        onClick={() => handleUpdate(t.id)}
                        className="rounded p-1.5 text-green-600 hover:bg-green-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="h-4 w-4 rounded-full shrink-0"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="font-medium text-gray-900">{t.name}</span>
                    {!t.is_active && (
                      <Badge className="bg-gray-100 text-gray-500">無効</Badge>
                    )}
                    <div className="ml-auto flex gap-1">
                      <button
                        onClick={() => {
                          setEditingId(t.id)
                          setEditName(t.name)
                          setEditColor(t.color)
                        }}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id, t.name)}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
          {(!types || types.length === 0) && (
            <p className="px-6 py-8 text-center text-sm text-gray-400">
              業種が登録されていません
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
