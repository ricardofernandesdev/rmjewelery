'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MobileNav } from '@/components/layout/MobileNav'
import { SearchModal } from '@/components/layout/SearchModal'
import { WishlistIcon } from '@/components/layout/WishlistIcon'
import { Container } from '@/components/ui/Container'

type NavItem = {
  label: string
  href: string
}

type Props = {
  logoUrl: string | null
  logoAlt: string
  navItems: NavItem[]
  isAuthenticated?: boolean
}

export const HeaderClient: React.FC<Props> = ({
  logoUrl,
  logoAlt,
  navItems,
  isAuthenticated = false,
}) => {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [scrolled, setScrolled] = useState(!isHome)

  useEffect(() => {
    if (!isHome) {
      setScrolled(true)
      return
    }
    const handleScroll = () => {
      setScrolled(window.scrollY > 80)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHome])

  return (
    <header
      className={`fixed ${isAuthenticated ? 'top-10' : 'top-0'} left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/95 backdrop-blur-md text-white shadow-sm'
          : 'bg-transparent text-white'
      }`}
    >
      <Container>
        {/* Row 1: Logo (left) + Search icon (right) */}
        <div className="flex items-center justify-between h-[100px]">
          <Link href="/" aria-label={logoAlt} className="flex items-center shrink-0">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={logoAlt}
                className="h-[90px] w-auto object-contain"
              />
            ) : (
              <span className="font-heading text-lg font-semibold tracking-wide">
                R&M Jewelry
              </span>
            )}
          </Link>

          <div className="flex items-center gap-5 shrink-0">
            <SearchModal triggerClassName="text-white/90 hover:text-white transition-colors" />
            <WishlistIcon className="text-white/90 hover:text-white transition-colors" />
            <div className="md:hidden">
              <MobileNav items={navItems} />
            </div>
          </div>
        </div>

        {/* Row 2: Centered navigation */}
        <nav
          className="hidden md:flex items-center justify-center gap-10 pb-4 border-b border-white/20"
          aria-label="Navegação principal"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[11px] font-medium tracking-[0.22em] uppercase text-white/90 hover:text-[#d4a853] hover:underline underline-offset-4 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  )
}
