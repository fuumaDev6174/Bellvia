import { Helmet } from 'react-helmet-async'

interface SEOHeadProps {
  title: string
  description?: string
  ogImage?: string
  canonicalUrl?: string
  structuredData?: Record<string, unknown>
}

export function SEOHead({ title, description, ogImage, canonicalUrl, structuredData }: SEOHeadProps) {
  const fullTitle = `${title} | Bellevia`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}

      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:type" content="website" />

      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {structuredData && (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}
    </Helmet>
  )
}
