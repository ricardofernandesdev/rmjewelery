import React from 'react'
import { getAllCategories, getSiteSettings } from '@/lib/queries'
import { HeaderClient } from '@/components/layout/HeaderClient'

export async function Header({ isAuthenticated = false }: { isAuthenticated?: boolean } = {}) {
  const [categoriesResult, settings] = await Promise.all([
    getAllCategories().catch(() => ({ docs: [] as any[] })),
    getSiteSettings().catch(() => null),
  ])
  const categories = categoriesResult.docs

  // Resolve logo URL — make relative URLs absolute
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  let logoUrl: string | null = null
  let logoAlt = 'RM Jewelry'
  const rawLogo = (settings as any)?.logo
  if (rawLogo && typeof rawLogo === 'object' && rawLogo.url) {
    const url = rawLogo.url as string
    logoUrl = url.startsWith('/') ? `${siteUrl}${url}` : url
    logoAlt = rawLogo.alt || logoAlt
  }

  const navItems = (categories || []).map((cat: any) => ({
    label: cat.name,
    href: `/categories/${cat.slug}`,
  }))

  return (
    <HeaderClient
      logoUrl={logoUrl}
      logoAlt={logoAlt}
      navItems={navItems}
      isAuthenticated={isAuthenticated}
    />
  )
}
