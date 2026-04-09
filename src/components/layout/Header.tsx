import React from 'react'
import { getAllCategories, getSiteSettings } from '@/lib/queries'
import { HeaderClient } from '@/components/layout/HeaderClient'

export async function Header() {
  const [{ docs: categories }, settings] = await Promise.all([
    getAllCategories(),
    getSiteSettings().catch(() => null),
  ])

  // Resolve logo — handles both populated object and raw ID
  let logoUrl: string | null = null
  let logoAlt = 'RM Jewelry'
  const rawLogo = (settings as any)?.logo
  if (rawLogo) {
    if (typeof rawLogo === 'object' && rawLogo.url) {
      logoUrl = rawLogo.url
      logoAlt = rawLogo.alt || logoAlt
    } else {
      const id = typeof rawLogo === 'object' ? rawLogo.id : rawLogo
      if (id) {
        try {
          const { getPayload } = await import('@/lib/payload')
          const payload = await getPayload()
          const media = await payload.findByID({ collection: 'media', id, depth: 0 })
          if (media?.url) {
            logoUrl = media.url
            logoAlt = media.alt || logoAlt
          }
        } catch {
          // ignore
        }
      }
    }
  }

  const navItems = categories.map((cat) => ({
    label: cat.name,
    href: `/categories/${cat.slug}`,
  }))

  return <HeaderClient logoUrl={logoUrl} logoAlt={logoAlt} navItems={navItems} />
}
