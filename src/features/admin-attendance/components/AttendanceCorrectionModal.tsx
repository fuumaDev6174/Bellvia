import { useState, useEffect, type FormEvent } from 'react'
import { Modal, Button, Input } from '@/components/ui'
import { useCorrectAttendance, type AttendanceWithStaff } from '../hooks/useAttendances'

interface AttendanceCorrectionModalProps {
  isOpen: boolean
  onClose: () => void
  attendance: AttendanceWithStaff | null
}

function toLocalDateTimeValue(isoString: string | null): string {
  if (!isoString) return ''
  const d = new Date(isoString)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export function AttendanceCorrectionModal({ isOpen, onClose, attendance }: AttendanceCorrectionModalProps) {
  const correctMutation = useCorrectAttendance()

  const [clockIn, setClockIn] = useState('')
  const [clockOut, setClockOut] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && attendance) {
      setClockIn(toLocalDateTimeValue(attendance.clock_in))
      setClockOut(toLocalDateTimeValue(attendance.clock_out))
      setReason('')
      setError('')
    }
  }, [isOpen, attendance])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!attendance) return
    if (!reason.trim()) {
      setError('修正理由は必須です')
      return
    }

    await correctMutation.mutateAsync({
      id: attendance.id,
      clockIn: clockIn ? new Date(clockIn).toISOString() : undefined,
      clockOut: clockOut ? new Date(clockOut).toISOString() : undefined,
      correctionReason: reason.trim(),
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="勤怠修正" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500">
          {attendance?.staff?.display_name ?? '-'} の勤怠記録を修正します
        </p>

        <Input
          label="出勤時刻"
          type="datetime-local"
          value={clockIn}
          onChange={(e) => setClockIn(e.target.value)}
        />

        <Input
          label="退勤時刻"
          type="datetime-local"
          value={clockOut}
          onChange={(e) => setClockOut(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">修正理由（必須）</label>
          <textarea
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            rows={2}
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError('') }}
            placeholder="修正理由を入力してください"
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" loading={correctMutation.isPending}>
            修正を保存
          </Button>
        </div>
      </form>
    </Modal>
  )
}
