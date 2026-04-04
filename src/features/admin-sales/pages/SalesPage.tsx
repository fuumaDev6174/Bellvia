import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, Input, Spinner } from '@/components/ui'
import { StoreSelector } from '@/components/ui/StoreSelector'
import { formatPrice, formatDateTimeJP } from '@/lib/utils'
import { TIMEZONE } from '@/lib/constants'

const PAYMENT_LABELS: Record<string, string> = {
  cash: '現金',
  paypay: 'PayPay',
  card: 'カード',
  other: 'その他',
}

function getMonthStart(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

function getToday(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: TIMEZONE })
}

interface SaleRecord {
  id: string
  amount: number
  payment_method: string
  paid_at: string
  notes: string | null
  staff?: { display_name: string }
  customer?: { name: string } | null
  store?: { name: string }
}

interface SalesSummary {
  totalAmount: number
  totalCount: number
  byPaymentMethod: Record<string, { count: number; amount: number }>
  byStore: Record<string, { count: number; amount: number }>
}

export default function SalesPage() {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(getMonthStart())
  const [endDate, setEndDate] = useState(getToday())

  const isAllStores = selectedStoreId === null
  const storeParam = selectedStoreId ? `&storeId=${selectedStoreId}` : ''

  const { data: summary, isLoading: loadingSummary } = useQuery<SalesSummary>({
    queryKey: ['sales-summary', selectedStoreId, startDate, endDate],
    queryFn: () =>
      api<SalesSummary>(
        `/api/admin/sales/summary?startDate=${startDate}&endDate=${endDate}${storeParam}`,
      ),
  })

  const { data: sales, isLoading: loadingSales } = useQuery<SaleRecord[]>({
    queryKey: ['sales', selectedStoreId, startDate, endDate],
    queryFn: () =>
      api<SaleRecord[]>(
        `/api/admin/sales?startDate=${startDate}&endDate=${endDate}${storeParam}`,
      ),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">売上管理</h1>
      </div>

      {/* Filters */}
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
          <Input
            label="開始日"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="終了日"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </Card>

      {loadingSummary ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : summary ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent>
                <p className="text-sm font-medium text-gray-500">売上合計</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {formatPrice(summary.totalAmount)}
                </p>
                <p className="mt-1 text-xs text-gray-500">{summary.totalCount}件</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm font-medium text-gray-500">客単価</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {summary.totalCount > 0
                    ? formatPrice(Math.round(summary.totalAmount / summary.totalCount))
                    : '¥0'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm font-medium text-gray-500">決済種別</p>
                <div className="mt-2 space-y-1">
                  {Object.entries(summary.byPaymentMethod).map(([method, { count, amount }]) => (
                    <div key={method} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {PAYMENT_LABELS[method] ?? method} ({count}件)
                      </span>
                      <span className="font-medium">{formatPrice(amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Store breakdown (only in all-store view) */}
          {isAllStores && Object.keys(summary.byStore).length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">店舗別売上</h2>
              </CardHeader>
              <div className="divide-y">
                {Object.entries(summary.byStore).map(([storeName, { count, amount }]) => (
                  <div key={storeName} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{storeName}</p>
                      <p className="text-sm text-gray-500">{count}件</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{formatPrice(amount)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : null}

      {/* Sales list */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">売上一覧</h2>
        </CardHeader>
        {loadingSales ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">日時</th>
                  {isAllStores && (
                    <th className="px-4 py-3 font-medium text-gray-500">店舗</th>
                  )}
                  <th className="px-4 py-3 font-medium text-gray-500">顧客</th>
                  <th className="px-4 py-3 font-medium text-gray-500">担当</th>
                  <th className="px-4 py-3 font-medium text-gray-500">決済</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">金額</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sales?.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDateTimeJP(sale.paid_at)}
                    </td>
                    {isAllStores && (
                      <td className="px-4 py-3">{sale.store?.name ?? '-'}</td>
                    )}
                    <td className="px-4 py-3">{sale.customer?.name ?? '-'}</td>
                    <td className="px-4 py-3">{sale.staff?.display_name ?? '-'}</td>
                    <td className="px-4 py-3">
                      {PAYMENT_LABELS[sale.payment_method] ?? sale.payment_method}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatPrice(sale.amount)}
                    </td>
                  </tr>
                ))}
                {(!sales || sales.length === 0) && (
                  <tr>
                    <td colSpan={isAllStores ? 6 : 5} className="px-4 py-8 text-center text-gray-400">
                      売上データがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
