import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { Modal, Button, Input, Select } from '@/components/ui'
import { useStoreContext } from '@/hooks/useStoreContext'
import type { Staff, Menu } from '@/types/models'

interface CreateReservationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateReservationModal({ isOpen, onClose }: CreateReservationModalProps) {
  const { activeStoreId } = useStoreContext()

  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [menuId, setMenuId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [source, setSource] = useState('phone')
  const [notes, setNotes] = useState('')

  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ['staff', activeStoreId],
    queryFn: () =>
      api<Staff[]>(`/api/admin/staff?storeId=${activeStoreId}&roles=stylist,store_manager`),
    enabled: !!activeStoreId,
  })

  const { data: menuList = [] } = useQuery<Menu[]>({
    queryKey: ['menus', activeStoreId],
    queryFn: () => api<Menu[]>(`/api/admin/menus?storeId=${activeStoreId}`),
    enabled: !!activeStoreId,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeStoreId) throw new Error('店舗情報が見つかりません')

      const selectedMenu = menuList.find((m) => m.id === menuId)
      if (!selectedMenu) throw new Error('メニューを選択してください')

      const startAt = `${date}T${time}:00`
      const startDate = new Date(startAt)
      const endDate = new Date(startDate.getTime() + selectedMenu.duration_min * 60 * 1000)

      await api('/api/admin/reservations', {
        method: 'POST',
        body: JSON.stringify({
          storeId: activeStoreId,
          staffId,
          menuId,
          startAt,
          endAt: endDate.toISOString(),
          source,
          guestName,
          guestPhone: guestPhone || undefined,
          notes: notes || undefined,
        }),
      })
    },
    onSuccess: () => {
      toast.success('予約を作成しました')
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      resetForm()
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || '予約の作成に失敗しました')
    },
  })

  const resetForm = () => {
    setGuestName('')
    setGuestPhone('')
    setMenuId('')
    setStaffId('')
    setDate('')
    setTime('')
    setSource('phone')
    setNotes('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!guestName || !menuId || !staffId || !date || !time) {
      toast.error('必須項目を入力してください')
      return
    }
    createMutation.mutate()
  }

  const isValid = guestName && menuId && staffId && date && time

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新規予約" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="お客様名 *"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="山田 花子"
          />
          <Input
            label="電話番号"
            type="tel"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            placeholder="090-1234-5678"
          />
        </div>

        <Select
          label="メニュー *"
          value={menuId}
          onChange={(e) => setMenuId(e.target.value)}
          placeholder="メニューを選択"
          options={menuList.map((m) => ({
            value: m.id,
            label: `${m.name}（¥${m.price.toLocaleString()} / ${m.duration_min}分）`,
          }))}
        />

        <Select
          label="スタイリスト *"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          placeholder="スタイリストを選択"
          options={staffList.map((s) => ({
            value: s.id,
            label: s.display_name,
          }))}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="日付 *"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            label="時間 *"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            step="1800"
          />
        </div>

        <Select
          label="予約経路"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          options={[
            { value: 'phone', label: '電話' },
            { value: 'walk-in', label: 'ウォークイン' },
            { value: 'web', label: 'Web' },
            { value: 'line', label: 'LINE' },
          ]}
        />

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="特記事項があれば入力"
          />
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            type="submit"
            disabled={!isValid}
            loading={createMutation.isPending}
          >
            予約を作成
          </Button>
        </div>
      </form>
    </Modal>
  )
}
