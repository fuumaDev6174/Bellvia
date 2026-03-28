import { MapPin, Phone, Clock } from 'lucide-react'
import { DAY_LABELS } from '@/lib/constants'
import type { Store, BusinessHours } from '@/types/models'

interface StoreInfoProps {
  store: Store
}

export function StoreInfo({ store }: StoreInfoProps) {
  const hours = store.business_hours as BusinessHours | null

  return (
    <section className="py-16 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">店舗情報</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            {store.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">住所</p>
                  <p className="text-gray-600">{store.address}</p>
                </div>
              </div>
            )}
            {store.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">電話番号</p>
                  <a href={`tel:${store.phone}`} className="text-primary-600 hover:underline">
                    {store.phone}
                  </a>
                </div>
              </div>
            )}
          </div>

          {hours && (
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-gray-900 mb-2">営業時間</p>
                <dl className="space-y-1 text-sm">
                  {Object.entries(DAY_LABELS).map(([key, label]) => {
                    const day = hours[key]
                    return (
                      <div key={key} className="flex gap-4">
                        <dt className="w-8 font-medium text-gray-700">{label}</dt>
                        <dd className="text-gray-600">
                          {day ? `${day.open} - ${day.close}` : '定休日'}
                        </dd>
                      </div>
                    )
                  })}
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
