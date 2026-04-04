import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { Card, CardHeader, Spinner, Badge, Input, Button } from '@/components/ui'
import { StoreSelector } from '@/components/ui/StoreSelector'
import { formatPrice } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

interface InventoryStock {
  id: string
  item_id: string
  store_id: string
  quantity: number
  min_quantity: number
  item?: { name: string; category: string | null; unit: string; cost_price: number; selling_price: number }
  store?: { name: string }
}

export default function InventoryPage() {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')

  const isAllStores = selectedStoreId === null
  const storeParam = selectedStoreId ? `?storeId=${selectedStoreId}` : ''

  const { data: stock, isLoading } = useQuery<InventoryStock[]>({
    queryKey: ['inventory-stock', selectedStoreId],
    queryFn: () => api<InventoryStock[]>(`/api/admin/inventory/stock${storeParam}`),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) =>
      api(`/api/admin/inventory/stock/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-stock'] })
      toast.success('在庫数を更新しました')
      setEditingId(null)
    },
    onError: () => toast.error('更新に失敗しました'),
  })

  const handleSave = (id: string) => {
    const qty = parseInt(editQty, 10)
    if (isNaN(qty) || qty < 0) {
      toast.error('有効な数値を入力してください')
      return
    }
    updateMutation.mutate({ id, quantity: qty })
  }

  // Group by category
  const grouped = (stock ?? []).reduce<Record<string, InventoryStock[]>>((acc, s) => {
    const cat = s.item?.category ?? 'その他'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  // Count low stock
  const lowStockCount = (stock ?? []).filter((s) => s.quantity <= s.min_quantity).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">在庫管理</h1>
        {lowStockCount > 0 && (
          <p className="mt-1 flex items-center gap-1 text-sm text-amber-600">
            <AlertTriangle className="h-4 w-4" />
            {lowStockCount}件の在庫が少なくなっています
          </p>
        )}
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-4 p-4">
          <div className="w-64">
            <StoreSelector
              value={selectedStoreId}
              onChange={setSelectedStoreId}
              allowAll
              label="店舗"
            />
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            在庫データがありません
          </div>
        </Card>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-500">商品名</th>
                    {isAllStores && (
                      <th className="px-4 py-3 font-medium text-gray-500">店舗</th>
                    )}
                    <th className="px-4 py-3 font-medium text-gray-500">単位</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">在庫数</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">最低在庫</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">原価</th>
                    <th className="px-4 py-3 font-medium text-gray-500">状態</th>
                    <th className="px-4 py-3 font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((s) => {
                    const isLow = s.quantity <= s.min_quantity
                    const isEditing = editingId === s.id
                    return (
                      <tr key={s.id} className={isLow ? 'bg-amber-50' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3 font-medium">{s.item?.name ?? '-'}</td>
                        {isAllStores && (
                          <td className="px-4 py-3">{s.store?.name ?? '-'}</td>
                        )}
                        <td className="px-4 py-3">{s.item?.unit ?? '-'}</td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editQty}
                              onChange={(e) => setEditQty(e.target.value)}
                              className="w-20 text-right"
                            />
                          ) : (
                            <span className={isLow ? 'font-bold text-amber-700' : ''}>
                              {s.quantity}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">{s.min_quantity}</td>
                        <td className="px-4 py-3 text-right">
                          {s.item?.cost_price ? formatPrice(s.item.cost_price) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {isLow ? (
                            <Badge className="bg-amber-100 text-amber-700">要補充</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700">正常</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSave(s.id)}
                                loading={updateMutation.isPending}
                              >
                                保存
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingId(null)}
                              >
                                取消
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(s.id)
                                setEditQty(String(s.quantity))
                              }}
                            >
                              編集
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
