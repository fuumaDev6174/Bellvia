import { Card, CardContent } from '@/components/ui'
import { formatPrice, formatDuration, cn } from '@/lib/utils'
import type { Menu } from '@/types/models'

interface MenuSelectProps {
  menus: Menu[]
  selectedId: string | null
  onSelect: (menu: Menu) => void
}

export function MenuSelect({ menus, selectedId, onSelect }: MenuSelectProps) {
  const grouped = menus.reduce<Record<string, Menu[]>>((acc, menu) => {
    const cat = ((menu as Record<string, unknown>).category as { name: string } | null)?.name ?? 'その他'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(menu)
    return acc
  }, {})

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">メニューを選択</h3>
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="mb-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">{category}</h4>
          <div className="grid gap-3">
            {items.map((menu) => (
              <Card
                key={menu.id}
                onClick={() => onSelect(menu)}
                className={cn(
                  'cursor-pointer transition-all',
                  selectedId === menu.id
                    ? 'ring-2 ring-primary-600 border-primary-600'
                    : 'hover:border-gray-300',
                )}
              >
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{menu.name}</p>
                      {menu.description && (
                        <p className="text-sm text-gray-500">{menu.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-semibold text-gray-900">{formatPrice(menu.price)}</p>
                      <p className="text-xs text-gray-500">{formatDuration(menu.duration_min)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
