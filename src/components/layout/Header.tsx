import React from 'react'
import Link from 'next/link'
import { getAllCategories } from '@/lib/queries'
import { Container } from '@/components/ui/Container'
import { MobileNav } from '@/components/layout/MobileNav'

type NavItem = {
  label: string
  href: string
}

export async function Header() {
  const { docs: categories } = await getAllCategories()

  const navItems: NavItem[] = [
    { label: 'Inicio', href: '/' },
    { label: 'Catalogo', href: '/products' },
    ...categories.slice(0, 4).map((cat) => ({
      label: cat.name,
      href: `/categories/${cat.slug}`,
    })),
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="font-heading text-xl font-semibold tracking-wide text-brand-dark"
          >
            RM Jewelry
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Navegacao principal">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-brand-gray hover:text-brand-dark transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile navigation */}
          <MobileNav items={navItems} />
        </div>
      </Container>
    </header>
  )
}
