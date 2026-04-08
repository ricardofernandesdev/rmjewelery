import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getAllCategories, getSiteSettings } from '@/lib/queries'
import { Container } from '@/components/ui/Container'
import { MobileNav } from '@/components/layout/MobileNav'
import { SearchBox } from '@/components/layout/SearchBox'

type NavItem = {
  label: string
  href: string
}

export async function Header() {
  const [{ docs: categories }, settings] = await Promise.all([
    getAllCategories(),
    getSiteSettings().catch(() => null),
  ])

  const logo =
    settings?.logo && typeof settings.logo === 'object' ? (settings.logo as any) : null
  const logoUrl = logo?.url || null
  const logoAlt = logo?.alt || 'RM Jewelry'

  const navItems: NavItem[] = categories.map((cat) => ({
    label: cat.name,
    href: `/categories/${cat.slug}`,
  }))

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <Container>
        {/* Top row — logo (left) + actions (right) */}
        <div className="relative flex items-center justify-between py-3 min-h-[100px]">
          {/* Logo (left) */}
          <Link
            href="/"
            className="font-heading text-xl font-semibold tracking-wide text-brand-dark flex items-center"
            aria-label={logoAlt}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={logoAlt}
                width={100}
                height={100}
                priority
                className="h-[90px] w-auto object-contain"
              />
            ) : (
              'RM Jewelry'
            )}
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-5">
            <Link
              href="/search"
              aria-label="Procurar"
              className="text-brand-dark hover:text-brand-gold transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
            </Link>

            {/* Mobile navigation toggle */}
            <div className="md:hidden">
              <MobileNav items={navItems} />
            </div>
          </div>
        </div>

        {/* Bottom row — centered nav */}
        <nav
          className="hidden md:flex items-center justify-center gap-10 py-4 border-t border-gray-100"
          aria-label="Navegacao principal"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-medium tracking-[0.2em] text-brand-dark uppercase hover:text-brand-gold transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  )
}
