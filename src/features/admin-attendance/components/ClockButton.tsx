import { useState } from 'react'
import { LogIn, LogOut } from 'lucide-react'
import { Button } from '@/components/ui'
import { formatTimeJP } from '@/lib/utils'
import { useMyAttendanceStatus, useClockIn, useClockOut } from '../hooks/useAttendances'

export function ClockButton() {
  const { data: currentAttendance, isLoading } = useMyAttendanceStatus()
  const clockIn = useClockIn()
  const clockOut = useClockOut()
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)

  const isClockedIn = !!currentAttendance

  async function handleClock() {
    if (isClockedIn) {
      await clockOut.mutateAsync(note || undefined)
    } else {
      await clockIn.mutateAsync(note || undefined)
    }
    setNote('')
    setShowNote(false)
  }

  if (isLoading) return null

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleClock}
        loading={clockIn.isPending || clockOut.isPending}
        className={
          isClockedIn
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }
      >
        {isClockedIn ? (
          <>
            <LogOut className="mr-1.5 h-4 w-4" />
            退勤する
          </>
        ) : (
          <>
            <LogIn className="mr-1.5 h-4 w-4" />
            出勤する
          </>
        )}
      </Button>

      {isClockedIn && currentAttendance && (
        <span className="text-sm text-gray-500">
          {formatTimeJP(currentAttendance.clock_in)} から出勤中
        </span>
      )}

      <button
        onClick={() => setShowNote(!showNote)}
        className="text-xs text-gray-400 hover:text-gray-600"
      >
        {showNote ? 'メモを閉じる' : 'メモを追加'}
      </button>

      {showNote && (
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="メモ（任意）"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      )}
    </div>
  )
}
