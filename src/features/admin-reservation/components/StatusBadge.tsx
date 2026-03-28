import { Badge } from '@/components/ui'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge className={STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800'}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  )
}
