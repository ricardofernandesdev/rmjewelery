import React from 'react'
import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import { JsonLd } from '@/components/seo/JsonLd'
import { getSiteSettings } from '@/lib/queries'

const manrope = Manrope({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
})

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rmjewelrycollection.com').replace(/\/$/, '')
const SITE_NAME = 'R&M Jewelry'
const SITE_DESCRIPTION = 'Peças de joalharia minimalistas e elegantes — R&M Jewelry.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'pt_PT',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
  },
  alternates: {
    canonical: SITE_URL,
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings().catch(() => null)
  const logo = settings?.logo && typeof settings.logo === 'object' ? (settings.logo as { url?: string }) : null
  const logoUrl = logo?.url ? (logo.url.startsWith('http') ? logo.url : `${SITE_URL}${logo.url}`) : null

  const sameAs = [
    (settings as { instagramUrl?: string } | null)?.instagramUrl,
    (settings as { facebookUrl?: string } | null)?.facebookUrl,
    (settings as { tiktokUrl?: string } | null)?.tiktokUrl,
  ].filter(Boolean) as string[]

  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    ...(logoUrl ? { logo: logoUrl } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  }

  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'pt-PT',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang="pt" className={manrope.variable}>
      <body suppressHydrationWarning>
        <JsonLd data={organizationLd} />
        <JsonLd data={websiteLd} />
        {children}
      </body>
    </html>
  )
}
