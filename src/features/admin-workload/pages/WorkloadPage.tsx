import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, Input, Spinner } from '@/components/ui'
import { useStoreContext } from '@/hooks/useStoreContext'
import { api } from '@/lib/api'
import { TIMEZONE } from '@/lib/constants'
import { useWorkload } from '../hooks/useWorkload'
import type { Staff } from '@/types/models'

function getMonthStart(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}
function getToday(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: TIMEZONE })
}

export default function WorkloadPage() {
  const { activeStoreId } = useStoreContext()
  const [startDate, setStartDate] = useState(getMonthStart())
  const [endDate, setEndDate] = useState(getToday())
  const [selectedStaffId, setSelectedStaffId] = useState('')

  const { data: staffList } = useQuery<Staff[]>({
    queryKey: ['admin-staff-workload', activeStoreId],
    queryFn: () => api<Staff[]>(`/api/admin/staff?storeId=${activeStoreId}&roles=stylist,store_manager`),
    enabled: !!activeStoreId,
  })

  const { data: workload, isLoading } = useWorkload(startDate, endDate, selectedStaffId || undefined)

  const totalPoints = workload?.reduce((sum, w) => sum + w.totalPoints, 0) ?? 0
  const totalCount = workload?.reduce((sum, w) => sum + w.totalCount, 0) ?? 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">仕事量</h1>

      <Card>
        <div className="flex flex-wrap items-end gap-4 p-4">
          <Input label="開始日" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="終了日" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">スタッフ</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">全スタッフ</option>
              {staffList?.map((s) => (
                <option key={s.id} value={s.id}>{s.display_name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-gray-500">合計ポイント</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{totalPoints.toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-gray-500">施術件数</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{totalCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Staff breakdown */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      ) : (
        <Card>
          <CardHeader><h2 className="text-lg font-semibold text-gray-900">スタッフ別仕事量</h2></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">スタッフ</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">件数</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">合計ポイント</th>
                  <th className="px-4 py-3 font-medium text-gray-500">メニュー内訳</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {workload?.map((w) => (
                  <tr key={w.staffId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{w.staffName}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{w.totalCount}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary-700">{w.totalPoints.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(w.byMenu).map(([name, { count, points }]) => (
                          <span key={name} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            {name} ×{count} ({points.toFixed(1)}pt)
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!workload || workload.length === 0) && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">データがありません</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
