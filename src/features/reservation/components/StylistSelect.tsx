import { Card, CardContent } from '@/components/ui'
import { UserCircle, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Staff } from '@/types/models'

interface StylistSelectProps {
  stylists: Staff[]
  selectedId: string | null
  onSelect: (staffId: string | null) => void
}

export function StylistSelect({ stylists, selectedId, onSelect }: StylistSelectProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">スタイリストを選択</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {/* "Anyone" option */}
        <Card
          onClick={() => onSelect(null)}
          className={cn(
            'cursor-pointer transition-all',
            selectedId === null
              ? 'ring-2 ring-primary-600 border-primary-600'
              : 'hover:border-gray-300',
          )}
        >
          <CardContent className="flex items-center gap-3 py-3">
            <Users className="h-10 w-10 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">指名なし</p>
              <p className="text-sm text-gray-500">空いているスタイリスト</p>
            </div>
          </CardContent>
        </Card>

        {stylists.map((stylist) => (
          <Card
            key={stylist.id}
            onClick={() => onSelect(stylist.id)}
            className={cn(
              'cursor-pointer transition-all',
              selectedId === stylist.id
                ? 'ring-2 ring-primary-600 border-primary-600'
                : 'hover:border-gray-300',
            )}
          >
            <CardContent className="flex items-center gap-3 py-3">
              {stylist.photo_url ? (
                <img
                  src={stylist.photo_url}
                  alt={stylist.display_name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <UserCircle className="h-10 w-10 text-gray-300" />
              )}
              <div>
                <p className="font-medium text-gray-900">{stylist.display_name}</p>
                {stylist.position && (
                  <p className="text-sm text-gray-500">{stylist.position}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
