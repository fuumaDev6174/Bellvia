import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { SEOHead } from '@/components/layout/SEOHead'
import { Card, CardContent, Spinner } from '@/components/ui'
import { MapPin, Scissors } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import type { Store } from '@/types/models'

export default function HomePage() {
  const { data: stores, isLoading } = useQuery<Store[]>({
    queryKey: ['public-stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return data
    },
  })

  return (
    <>
      <SEOHead
        title="トップ"
        description="大阪の美容サロン Bellevia。心斎橋・梅田・なんばの3店舗で、あなたにぴったりのスタイルをご提案します。"
      />

      <section className="bg-gradient-to-br from-primary-50 to-accent-50 py-20 lg:py-32">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <Scissors className="mx-auto h-12 w-12 text-primary-600" />
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            {APP_NAME}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            大阪に3店舗。あなたの「なりたい」を叶える美容サロン。
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">店舗一覧</h2>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-8 w-8 text-primary-600" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {stores?.map((store) => (
                <Link key={store.id} to={`/${store.slug}`}>
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardContent>
                      <h3 className="text-lg font-semibold text-gray-900">{store.name}</h3>
                      {store.address && (
                        <p className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-4 w-4" />
                          {store.address}
                        </p>
                      )}
                      {store.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{store.description}</p>
                      )}
                      <span className="mt-4 inline-block text-sm font-medium text-primary-600">
                        詳しく見る →
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
