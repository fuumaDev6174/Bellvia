import { useParams } from 'react-router-dom'
import { SEOHead } from '@/components/layout/SEOHead'
import { Spinner } from '@/components/ui'
import { useStoreBySlug } from '../hooks/useStoreBySlug'
import { usePublicStylists } from '../hooks/usePublicStylists'
import { StylistCard } from '../components/StylistCard'
import { CTAButton } from '../components/CTAButton'

export default function StylistPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>()
  const { data: store, isLoading: storeLoading } = useStoreBySlug(storeSlug)
  const { data: stylists, isLoading: stylistsLoading } = usePublicStylists(store?.id)

  if (storeLoading || stylistsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    )
  }

  if (!store) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">店舗が見つかりません</p>
      </div>
    )
  }

  return (
    <>
      <SEOHead
        title={`スタイリスト - ${store.name}`}
        description={`${store.name}のスタイリスト一覧。経験豊富なスタイリストがあなたに似合うスタイルをご提案します。`}
      />

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-10">スタイリスト</h1>

          {stylists && stylists.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {stylists.map((stylist) => (
                <StylistCard key={stylist.id} stylist={stylist} storeSlug={storeSlug!} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">スタイリスト情報は準備中です</p>
          )}
        </div>
      </section>

      <CTAButton storeSlug={storeSlug!} />
    </>
  )
}
