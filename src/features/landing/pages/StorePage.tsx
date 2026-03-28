import { useParams, Link } from 'react-router-dom'
import { SEOHead } from '@/components/layout/SEOHead'
import { Spinner } from '@/components/ui'
import { useStoreBySlug } from '../hooks/useStoreBySlug'
import { usePublicMenus } from '../hooks/usePublicMenus'
import { usePublicStylists } from '../hooks/usePublicStylists'
import { HeroSection } from '../components/HeroSection'
import { MenuCard } from '../components/MenuCard'
import { StylistCard } from '../components/StylistCard'
import { StoreInfo } from '../components/StoreInfo'
import { CTAButton } from '../components/CTAButton'

export default function StorePage() {
  const { storeSlug } = useParams<{ storeSlug: string }>()
  const { data: store, isLoading: storeLoading } = useStoreBySlug(storeSlug)
  const { data: menus } = usePublicMenus(store?.id)
  const { data: stylists } = usePublicStylists(store?.id)

  if (storeLoading) {
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

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'HairSalon',
    name: store.name,
    address: store.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: store.address,
          addressLocality: '大阪市',
          addressRegion: '大阪府',
          addressCountry: 'JP',
        }
      : undefined,
    telephone: store.phone,
    description: store.description,
  }

  return (
    <>
      <SEOHead
        title={store.name}
        description={store.description ?? `${store.name} - 大阪の美容サロン Bellevia`}
        structuredData={structuredData}
      />

      <HeroSection store={store} />

      {/* Menu highlights */}
      {menus && menus.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">メニュー</h2>
              <Link
                to={`/${storeSlug}/menu`}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                すべてのメニュー →
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {menus.slice(0, 4).map((menu) => (
                <MenuCard key={menu.id} menu={menu} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stylists highlights */}
      {stylists && stylists.length > 0 && (
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">スタイリスト</h2>
              <Link
                to={`/${storeSlug}/stylists`}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                全スタイリスト →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {stylists.slice(0, 3).map((stylist) => (
                <StylistCard key={stylist.id} stylist={stylist} storeSlug={storeSlug!} />
              ))}
            </div>
          </div>
        </section>
      )}

      <StoreInfo store={store} />
      <CTAButton storeSlug={storeSlug!} />
    </>
  )
}
