import { useState } from 'react'
import {
  format,
  addDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isBefore,
  addMonths,
  subMonths,
} from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BOOKING_ADVANCE_DAYS } from '@/lib/constants'

interface DatePickerProps {
  selectedDate: string | null
  onSelect: (date: string) => void
}

export function DatePicker({ selectedDate, onSelect }: DatePickerProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maxDate = addDays(today, BOOKING_ADVANCE_DAYS)
  const [currentMonth, setCurrentMonth] = useState(today)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days: Date[] = []
  let day = calStart
  while (day <= calEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  const weekDays = ['月', '火', '水', '木', '金', '土', '日']

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">日付を選択</h3>
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            disabled={isSameMonth(currentMonth, today)}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-medium text-gray-900">
            {format(currentMonth, 'yyyy年M月', { locale: ja })}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1 rounded hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-1">
          {weekDays.map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const dateStr = format(d, 'yyyy-MM-dd')
            const isCurrentMonth = isSameMonth(d, currentMonth)
            const isPast = isBefore(d, today)
            const isTooFar = d > maxDate
            const isDisabled = !isCurrentMonth || isPast || isTooFar
            const isSelected = selectedDate === dateStr
            const isToday = isSameDay(d, today)

            return (
              <button
                key={dateStr}
                onClick={() => !isDisabled && onSelect(dateStr)}
                disabled={isDisabled}
                className={cn(
                  'aspect-square flex items-center justify-center rounded-lg text-sm transition-colors',
                  isDisabled && 'text-gray-300 cursor-default',
                  !isDisabled && !isSelected && 'hover:bg-primary-50 text-gray-700',
                  isSelected && 'bg-primary-600 text-white font-medium',
                  isToday && !isSelected && 'ring-1 ring-primary-400',
                )}
              >
                {format(d, 'd')}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
