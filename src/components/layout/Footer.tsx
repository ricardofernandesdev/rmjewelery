import React from 'react'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { getFooterSettings, getSiteSettings } from '@/lib/queries'

type FooterLink = {
  label: string
  url: string
  newTab?: boolean
}

type FooterColumn = {
  title: string
  links: FooterLink[]
}

export async function Footer() {
  const [settings, siteSettings] = await Promise.all([
    getFooterSettings().catch(() => null),
    getSiteSettings().catch(() => null),
  ])
  const columns: FooterColumn[] = (settings as any)?.columns || []
  const copyrightRaw: string =
    (settings as any)?.copyright || '© {year} RM Jewelry. Todos os direitos reservados.'
  const copyright = copyrightRaw.replace('{year}', String(new Date().getFullYear()))
  const instagramPageUrl: string =
    (siteSettings as any)?.instagramPageUrl || 'https://www.instagram.com/rmjewelry.collection/'
  const tiktokUrl: string | null = (siteSettings as any)?.tiktokUrl || null
  const facebookUrl: string | null = (siteSettings as any)?.facebookUrl || null

  return (
    <footer className="bg-black text-white py-16">
      <Container>
        {columns.length > 0 ? (
          <div className={`grid gap-8 md:gap-12 mb-12 grid-cols-1 sm:grid-cols-2 ${columns.length >= 3 ? 'md:grid-cols-3' : ''} ${columns.length >= 4 ? 'lg:grid-cols-4' : ''}`}>
            {columns.map((col, i) => (
              <div key={i}>
                <h3 className="text-sm font-bold tracking-[0.15em] uppercase mb-6">
                  {col.title}
                </h3>
                <ul className="space-y-3">
                  {(col.links || []).map((link, j) => (
                    <li key={j}>
                      {link.url.startsWith('http') || link.newTab ? (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-white/70 hover:text-white transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.url}
                          className="text-sm text-white/70 hover:text-white transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          /* Fallback if no columns configured */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 mb-12">
            <div>
              <h3 className="text-sm font-bold tracking-[0.15em] uppercase mb-6">R&M JEWELRY</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/about" className="text-sm text-white/70 hover:text-white transition-colors">
                    Sobre nós
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-[0.15em] uppercase mb-6">CATÁLOGO</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/products" className="text-sm text-white/70 hover:text-white transition-colors">
                    Ver todos
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-[0.15em] uppercase mb-6">MAIS INFORMAÇÕES</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/about" className="text-sm text-white/70 hover:text-white transition-colors">
                    Sobre nós
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/50">{copyright}</p>
          <div className="flex items-center gap-5">
            <a
              href={instagramPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            {tiktokUrl && (
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors"
                aria-label="TikTok"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.8 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.84-.1z" />
                </svg>
              </a>
            )}
            {facebookUrl && (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </Container>
    </footer>
  )
}
