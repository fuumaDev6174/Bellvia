import { useParams } from 'react-router-dom'
import { SEOHead } from '@/components/layout/SEOHead'
import { Spinner } from '@/components/ui'
import { useStoreBySlug } from '../hooks/useStoreBySlug'
import { usePublicMenus } from '../hooks/usePublicMenus'
import { MenuCard } from '../components/MenuCard'
import { CTAButton } from '../components/CTAButton'

export default function MenuPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>()
  const { data: store, isLoading: storeLoading } = useStoreBySlug(storeSlug)
  const { data: menus, isLoading: menusLoading } = usePublicMenus(store?.id)

  if (storeLoading || menusLoading) {
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

  // Group menus by category
  const grouped = (menus ?? []).reduce<Record<string, typeof menus>>((acc, menu) => {
    const cat = ((menu as Record<string, unknown>).category as { name: string } | null)?.name ?? 'その他'
    if (!acc[cat]) acc[cat] = []
    acc[cat]!.push(menu)
    return acc
  }, {})

  return (
    <>
      <SEOHead
        title={`メニュー - ${store.name}`}
        description={`${store.name}のメニュー一覧。カット・カラー・パーマ・トリートメントなど。`}
      />

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-10">メニュー</h1>

          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-10">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">{category}</h2>
              <div className="grid gap-4">
                {items?.map((menu) => (
                  <MenuCard key={menu.id} menu={menu} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <CTAButton storeSlug={storeSlug!} />
    </>
  )
}
