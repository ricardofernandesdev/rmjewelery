'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type EditableTarget = {
  label: string
  collectionOrGlobal: 'products' | 'categories' | 'pages' | 'home-settings'
  slug?: string
}

/**
 * Derive which Payload document (if any) corresponds to the current frontend URL.
 * Returns null if the page is not backed by an editable document.
 */
function matchEditable(pathname: string): EditableTarget | null {
  if (pathname === '/') {
    return { label: 'Editar Página Inicial', collectionOrGlobal: 'home-settings' }
  }

  const productMatch = pathname.match(/^\/products\/([^/]+)$/)
  if (productMatch) {
    return { label: 'Editar Produto', collectionOrGlobal: 'products', slug: productMatch[1] }
  }

  const categoryMatch = pathname.match(/^\/categories\/([^/]+)$/)
  if (categoryMatch) {
    return { label: 'Editar Categoria', collectionOrGlobal: 'categories', slug: categoryMatch[1] }
  }

  // Skip reserved first-level routes, treat anything else with exactly one segment as a Page
  const reserved = new Set([
    'products',
    'categories',
    'wishlist',
    'search',
    'admin',
    'api',
  ])
  const singleSegment = pathname.match(/^\/([^/]+)$/)
  if (singleSegment && !reserved.has(singleSegment[1])) {
    return { label: 'Editar Página', collectionOrGlobal: 'pages', slug: singleSegment[1] }
  }

  return null
}

export const AdminBarClient: React.FC = () => {
  const pathname = usePathname() || '/'
  const [editHref, setEditHref] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setEditHref(null)
    setEditLabel(null)

    const target = matchEditable(pathname)
    if (!target) return

    // Globals have a static edit URL
    if (target.collectionOrGlobal === 'home-settings') {
      setEditHref('/admin/globals/home-settings')
      setEditLabel(target.label)
      return
    }

    // Collections: resolve ID by slug via Payload REST API
    const url = `/api/${target.collectionOrGlobal}?where[slug][equals]=${encodeURIComponent(
      target.slug || '',
    )}&limit=1&depth=0`

    fetch(url, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        const doc = data?.docs?.[0]
        if (doc?.id != null) {
          setEditHref(`/admin/collections/${target.collectionOrGlobal}/${doc.id}`)
          setEditLabel(target.label)
        }
      })
      .catch(() => {
        /* ignore */
      })

    return () => {
      cancelled = true
    }
  }, [pathname])

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-10 bg-brand-dark text-white text-xs flex items-center justify-between px-4 shadow-md border-b border-white/10">
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span className="font-semibold tracking-wider uppercase">RM Admin</span>
      </div>

      <div className="flex items-center gap-2">
        {editHref && (
          <Link
            href={editHref}
            className="flex items-center gap-1.5 px-3 h-7 border border-white/30 hover:bg-white hover:text-brand-dark transition-colors uppercase tracking-wider"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            {editLabel || 'Editar'}
          </Link>
        )}
        <Link
          href="/admin"
          className="flex items-center gap-1.5 px-3 h-7 bg-white text-brand-dark hover:bg-brand-gold hover:text-white transition-colors uppercase tracking-wider font-medium"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09A1.65 1.65 0 0015 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          Admin
        </Link>
      </div>
    </div>
  )
}
