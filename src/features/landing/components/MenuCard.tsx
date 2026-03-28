import { Card, CardContent } from '@/components/ui'
import { formatPrice, formatDuration } from '@/lib/utils'
import type { Menu } from '@/types/models'

interface MenuCardProps {
  menu: Menu
}

export function MenuCard({ menu }: MenuCardProps) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{menu.name}</h3>
            {menu.category && (
              <span className="text-xs text-primary-600 font-medium">{menu.category}</span>
            )}
            {menu.description && (
              <p className="mt-1 text-sm text-gray-500">{menu.description}</p>
            )}
          </div>
          <div className="text-right shrink-0 ml-4">
            <p className="text-lg font-bold text-gray-900">{formatPrice(menu.price)}</p>
            <p className="text-xs text-gray-500">{formatDuration(menu.duration_min)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
