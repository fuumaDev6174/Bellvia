import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, Input, Spinner, Badge } from '@/components/ui'
import { useStoreContext } from '@/hooks/useStoreContext'
import { api } from '@/lib/api'
import { formatDateJP, formatTimeJP } from '@/lib/utils'
import { TIMEZONE } from '@/lib/constants'
import { useAttendances, type AttendanceWithStaff } from '../hooks/useAttendances'
import { AttendanceCorrectionModal } from '../components/AttendanceCorrectionModal'
import type { Staff } from '@/types/models'

function getMonthStart(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}
function getToday(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: TIMEZONE })
}

function calcWorkingHours(clockIn: string, clockOut: string | null): string {
  if (!clockOut) return '-'
  const diff = new Date(clockOut).getTime() - new Date(clockIn).getTime()
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  return `${hours}:${String(minutes).padStart(2, '0')}`
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  clocked_in: { label: '出勤中', className: 'bg-blue-100 text-blue-700' },
  completed: { label: '完了', className: 'bg-green-100 text-green-700' },
  corrected: { label: '修正済', className: 'bg-amber-100 text-amber-700' },
}

export default function AttendanceManagePage() {
  const { activeStoreId } = useStoreContext()
  const [startDate, setStartDate] = useState(getMonthStart())
  const [endDate, setEndDate] = useState(getToday())
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [correcting, setCorrecting] = useState<AttendanceWithStaff | null>(null)

  const { data: staffList } = useQuery<Staff[]>({
    queryKey: ['admin-staff-attendance', activeStoreId],
    queryFn: () => api<Staff[]>(`/api/admin/staff?storeId=${activeStoreId}`),
    enabled: !!activeStoreId,
  })

  const { data: attendances, isLoading } = useAttendances(startDate, endDate, selectedStaffId || undefined)

  // Calculate total hours per staff
  const totalByStaff = new Map<string, { name: string; totalMs: number; count: number }>()
  for (const a of attendances ?? []) {
    const name = a.staff?.display_name ?? '-'
    if (!totalByStaff.has(a.staff_id)) {
      totalByStaff.set(a.staff_id, { name, totalMs: 0, count: 0 })
    }
    const entry = totalByStaff.get(a.staff_id)!
    entry.count++
    if (a.clock_out) {
      entry.totalMs += new Date(a.clock_out).getTime() - new Date(a.clock_in).getTime()
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">勤怠管理</h1>

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

      {/* Summary cards */}
      {totalByStaff.size > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from(totalByStaff.entries()).map(([staffId, { name, totalMs, count }]) => {
            const hours = Math.floor(totalMs / 3600000)
            const minutes = Math.floor((totalMs % 3600000) / 60000)
            return (
              <Card key={staffId}>
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-900">{name}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {hours}:{String(minutes).padStart(2, '0')}
                  </p>
                  <p className="text-xs text-gray-500">{count}日出勤</p>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Attendance table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">勤怠一覧</h2>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">日付</th>
                  <th className="px-4 py-3 font-medium text-gray-500">スタッフ</th>
                  <th className="px-4 py-3 font-medium text-gray-500">出勤</th>
                  <th className="px-4 py-3 font-medium text-gray-500">退勤</th>
                  <th className="px-4 py-3 font-medium text-gray-500">勤務時間</th>
                  <th className="px-4 py-3 font-medium text-gray-500">ステータス</th>
                  <th className="px-4 py-3 font-medium text-gray-500">メモ</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {attendances?.map((a) => {
                  const badge = STATUS_BADGE[a.status] ?? STATUS_BADGE.completed
                  return (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">{formatDateJP(a.clock_in)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {a.staff?.display_name ?? '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatTimeJP(a.clock_in)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {a.clock_out ? formatTimeJP(a.clock_out) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium">
                        {calcWorkingHours(a.clock_in, a.clock_out)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={badge.className}>{badge.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">
                        {a.clock_in_note || a.clock_out_note || a.correction_reason || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setCorrecting(a)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="修正"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {(!attendances || attendances.length === 0) && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      勤怠データがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AttendanceCorrectionModal
        isOpen={correcting !== null}
        onClose={() => setCorrecting(null)}
        attendance={correcting}
      />
    </div>
  )
}
