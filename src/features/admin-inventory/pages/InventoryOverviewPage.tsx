import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardHeader, Spinner, Badge } from '@/components/ui'
import { formatPrice } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

interface InventoryStock {
  id: string; quantity: number; min_quantity: number
  item?: { name: string; category: string | null; unit: string; cost_price: number }
  store?: { name: string }
}

export default function InventoryOverviewPage() {
  const { data: stock, isLoading } = useQuery<InventoryStock[]>({
    queryKey: ['inventory-stock', 'all'],
    queryFn: () => api<InventoryStock[]>('/api/admin/inventory/stock'),
  })

  const grouped = (stock ?? []).reduce<Record<string, InventoryStock[]>>((acc, s) => {
    const cat = s.item?.category ?? 'その他'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  const lowStockCount = (stock ?? []).filter((s) => s.quantity <= s.min_quantity).length

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">在庫総括</h1>
        <p className="mt-1 text-sm text-gray-500">全店舗横断の在庫データ</p>
        {lowStockCount > 0 && (
          <p className="mt-1 flex items-center gap-1 text-sm text-amber-600">
            <AlertTriangle className="h-4 w-4" /> {lowStockCount}件の在庫が少なくなっています
          </p>
        )}
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card><div className="px-6 py-12 text-center text-sm text-gray-400">在庫データがありません</div></Card>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <Card key={category}>
            <CardHeader><h2 className="text-lg font-semibold text-gray-900">{category}</h2></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-500">商品名</th>
                    <th className="px-4 py-3 font-medium text-gray-500">店舗</th>
                    <th className="px-4 py-3 font-medium text-gray-500">単位</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">在庫数</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">最低在庫</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">原価</th>
                    <th className="px-4 py-3 font-medium text-gray-500">状態</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((s) => {
                    const isLow = s.quantity <= s.min_quantity
                    return (
                      <tr key={s.id} className={isLow ? 'bg-amber-50' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3 font-medium">{s.item?.name ?? '-'}</td>
                        <td className="px-4 py-3">{s.store?.name ?? '-'}</td>
                        <td className="px-4 py-3">{s.item?.unit ?? '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={isLow ? 'font-bold text-amber-700' : ''}>{s.quantity}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">{s.min_quantity}</td>
                        <td className="px-4 py-3 text-right">{s.item?.cost_price ? formatPrice(s.item.cost_price) : '-'}</td>
                        <td className="px-4 py-3">
                          <Badge className={isLow ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}>
                            {isLow ? '要補充' : '正常'}
                          </Badge>
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
