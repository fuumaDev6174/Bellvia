import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useStoreContext } from '@/hooks/useStoreContext'
import { TIMEZONE } from '@/lib/constants'
import { Card, Button, Input, Select, Spinner } from '@/components/ui'
import { useReservations } from '../hooks/useReservations'
import { ReservationTable } from '../components/ReservationTable'
import { ReservationDetailModal } from '../components/ReservationDetailModal'
import { CreateReservationModal } from '../components/CreateReservationModal'
import type { ReservationWithDetails, ReservationStatus, Staff } from '@/types/models'

function getToday(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: TIMEZONE })
}

export default function ReservationListPage() {
  const { activeStoreId } = useStoreContext()

  // Filters
  const [startDate, setStartDate] = useState(getToday())
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState<ReservationStatus | ''>('')
  const [staffId, setStaffId] = useState('')

  // Modals
  const [selectedReservation, setSelectedReservation] = useState<ReservationWithDetails | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Fetch staff for filter dropdown
  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ['staff', activeStoreId],
    queryFn: () => api<Staff[]>(`/api/admin/staff?storeId=${activeStoreId}`),
    enabled: !!activeStoreId,
  })

  const { data: reservations = [], isLoading } = useReservations({
    storeId: activeStoreId,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    status: status || undefined,
    staffId: staffId || undefined,
  })

  const handleRowClick = (reservation: ReservationWithDetails) => {
    setSelectedReservation(reservation)
    setIsDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setIsDetailOpen(false)
    setSelectedReservation(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">予約管理</h1>
        <Button onClick={() => setIsCreateOpen(true)}>新規予約</Button>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b">
        <Link
          to="/admin/reservations"
          className="border-b-2 border-primary-600 px-4 py-2 text-sm font-medium text-primary-600"
        >
          リスト
        </Link>
        <Link
          to="/admin/reservations/calendar"
          className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          カレンダー
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-end gap-4 p-4">
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
          <Select
            label="ステータス"
            value={status}
            onChange={(e) => setStatus(e.target.value as ReservationStatus | '')}
            placeholder="すべて"
            options={[
              { value: 'confirmed', label: '予約確定' },
              { value: 'completed', label: '施術完了' },
              { value: 'cancelled', label: 'キャンセル' },
              { value: 'no_show', label: '無断キャンセル' },
            ]}
          />
          <Select
            label="スタイリスト"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            placeholder="すべて"
            options={staffList
              .filter((s) => s.role === 'stylist' || s.role === 'store_manager')
              .map((s) => ({
                value: s.id,
                label: s.display_name,
              }))}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStartDate(getToday())
              setEndDate('')
              setStatus('')
              setStaffId('')
            }}
          >
            リセット
          </Button>
        </div>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <Card>
          <ReservationTable
            reservations={reservations}
            onRowClick={handleRowClick}
          />
        </Card>
      )}

      {/* Modals */}
      <ReservationDetailModal
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        reservation={selectedReservation}
      />
      <CreateReservationModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  )
}
