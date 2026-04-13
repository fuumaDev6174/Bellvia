import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui'
import { UserCircle } from 'lucide-react'
import type { Staff } from '@/types/models'

interface StylistCardProps {
  stylist: Staff
  storeSlug: string
}

export function StylistCard({ stylist, storeSlug }: StylistCardProps) {
  return (
    <Card>
      <CardContent className="text-center">
        {stylist.photo_url ? (
          <img
            src={stylist.photo_url}
            alt={stylist.display_name}
            className="mx-auto h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <UserCircle className="mx-auto h-24 w-24 text-gray-300" />
        )}
        <h3 className="mt-3 font-semibold text-gray-900">{stylist.display_name}</h3>
        {stylist.position && (
          <p className="text-sm text-primary-600">{stylist.position}</p>
        )}
        {stylist.bio && (
          <p className="mt-2 text-sm text-gray-500 line-clamp-3">{stylist.bio}</p>
        )}
        {Array.isArray((stylist as Record<string, unknown>).specialties) && ((stylist as Record<string, unknown>).specialties as string[]).length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1">
            {((stylist as Record<string, unknown>).specialties as string[]).map((s: string) => (
              <span key={s} className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700">
                {s}
              </span>
            ))}
          </div>
        )}
        <Link
          to={`/${storeSlug}/reserve`}
          className="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          このスタイリストで予約
        </Link>
      </CardContent>
    </Card>
  )
}
