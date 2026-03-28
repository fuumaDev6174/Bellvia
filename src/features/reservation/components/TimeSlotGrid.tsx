import { Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'
import { TIMEZONE } from '@/lib/constants'
import type { AvailableSlot } from '@/types/models'

interface TimeSlotGridProps {
  slots: AvailableSlot[]
  isLoading: boolean
  selectedTime: string | null
  onSelect: (slot: AvailableSlot) => void
}

export function TimeSlotGrid({ slots, isLoading, selectedTime, onSelect }: TimeSlotGridProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner className="h-6 w-6 text-primary-600" />
      </div>
    )
  }

  // Deduplicate slots by time (show earliest available staff per time)
  const uniqueSlots = new Map<string, AvailableSlot>()
  for (const slot of slots) {
    const timeKey = new Date(slot.time).toLocaleTimeString('ja-JP', {
      timeZone: TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
    })
    if (!uniqueSlots.has(timeKey)) {
      uniqueSlots.set(timeKey, slot)
    }
  }

  if (uniqueSlots.size === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500">この日は空きがありません</p>
        <p className="text-sm text-gray-400 mt-1">別の日付をお選びください</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">時間を選択</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {Array.from(uniqueSlots.entries()).map(([timeLabel, slot]) => (
          <button
            key={slot.time}
            onClick={() => onSelect(slot)}
            className={cn(
              'rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
              selectedTime === slot.time
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50',
            )}
          >
            {timeLabel}
          </button>
        ))}
      </div>
    </div>
  )
}
