import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, Input, Spinner } from '@/components/ui'
import { formatPrice, formatDateTimeJP } from '@/lib/utils'
import { TIMEZONE } from '@/lib/constants'

const PAYMENT_LABELS: Record<string, string> = {
  cash: '現金', paypay: 'PayPay', card: 'カード', other: 'その他',
}

function getMonthStart(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}
function getToday(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: TIMEZONE })
}

interface SaleRecord {
  id: string; amount: number; payment_method: string; paid_at: string
  staff?: { display_name: string }; customer?: { name: string } | null; store?: { name: string }
}
interface SalesSummary {
  totalAmount: number; totalCount: number
  byPaymentMethod: Record<string, { count: number; amount: number }>
  byStore: Record<string, { count: number; amount: number }>
}

export default function SalesOverviewPage() {
  const [startDate, setStartDate] = useState(getMonthStart())
  const [endDate, setEndDate] = useState(getToday())

  const { data: summary, isLoading: loadingSummary } = useQuery<SalesSummary>({
    queryKey: ['sales-summary', 'all', startDate, endDate],
    queryFn: () => api<SalesSummary>(`/api/admin/sales/summary?startDate=${startDate}&endDate=${endDate}`),
  })

  const { data: sales, isLoading: loadingSales } = useQuery<SaleRecord[]>({
    queryKey: ['sales', 'all', startDate, endDate],
    queryFn: () => api<SaleRecord[]>(`/api/admin/sales?startDate=${startDate}&endDate=${endDate}`),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">売上総括</h1>
        <p className="mt-1 text-sm text-gray-500">全店舗横断の売上データ</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-4 p-4">
          <Input label="開始日" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="終了日" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </Card>

      {loadingSummary ? (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card><CardContent>
              <p className="text-sm font-medium text-gray-500">売上合計</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{formatPrice(summary.totalAmount)}</p>
              <p className="mt-1 text-xs text-gray-500">{summary.totalCount}件</p>
            </CardContent></Card>
            <Card><CardContent>
              <p className="text-sm font-medium text-gray-500">客単価</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {summary.totalCount > 0 ? formatPrice(Math.round(summary.totalAmount / summary.totalCount)) : '¥0'}
              </p>
            </CardContent></Card>
            <Card><CardContent>
              <p className="text-sm font-medium text-gray-500">決済種別</p>
              <div className="mt-2 space-y-1">
                {Object.entries(summary.byPaymentMethod).map(([m, { count, amount }]) => (
                  <div key={m} className="flex justify-between text-sm">
                    <span className="text-gray-600">{PAYMENT_LABELS[m] ?? m} ({count}件)</span>
                    <span className="font-medium">{formatPrice(amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          </div>

          {Object.keys(summary.byStore).length > 0 && (
            <Card>
              <CardHeader><h2 className="text-lg font-semibold text-gray-900">店舗別売上</h2></CardHeader>
              <div className="divide-y">
                {Object.entries(summary.byStore).map(([name, { count, amount }]) => (
                  <div key={name} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{name}</p>
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

      <Card>
        <CardHeader><h2 className="text-lg font-semibold text-gray-900">売上一覧</h2></CardHeader>
        {loadingSales ? (
          <div className="flex justify-center py-8"><Spinner className="h-6 w-6" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">日時</th>
                  <th className="px-4 py-3 font-medium text-gray-500">店舗</th>
                  <th className="px-4 py-3 font-medium text-gray-500">顧客</th>
                  <th className="px-4 py-3 font-medium text-gray-500">担当</th>
                  <th className="px-4 py-3 font-medium text-gray-500">決済</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">金額</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sales?.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateTimeJP(s.paid_at)}</td>
                    <td className="px-4 py-3">{s.store?.name ?? '-'}</td>
                    <td className="px-4 py-3">{s.customer?.name ?? '-'}</td>
                    <td className="px-4 py-3">{s.staff?.display_name ?? '-'}</td>
                    <td className="px-4 py-3">{PAYMENT_LABELS[s.payment_method] ?? s.payment_method}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatPrice(s.amount)}</td>
                  </tr>
                ))}
                {(!sales || sales.length === 0) && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">売上データがありません</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
