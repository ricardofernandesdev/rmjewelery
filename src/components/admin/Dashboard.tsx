import React from 'react'
import type { AdminViewServerProps } from 'payload'
import './Dashboard.scss'

const globalMeta: Array<{ slug: string; label: string; href: string; icon: React.ReactNode }> = [
  {
    slug: 'site-settings',
    label: 'DEFINIÇÕES',
    href: '/admin/globals/site-settings',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94 0 .31.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
      </svg>
    ),
  },
  {
    slug: 'home-settings',
    label: 'HOMEPAGE',
    href: '/admin/globals/home-settings',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
      </svg>
    ),
  },
]

const pagesIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM9 13h6v2H9v-2zm0-3h6v2H9v-2zm0 6h4v2H9v-2z" />
  </svg>
)

const collectionMeta: Record<string, { label: string; icon: React.ReactNode }> = {
  media: {
    label: 'MEDIA',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 3H3C1.9 3 1 3.9 1 5v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 15.5c0 .28-.22.5-.5.5h-17c-.28 0-.5-.22-.5-.5V5.5c0-.28.22-.5.5-.5h17c.28 0 .5.22.5.5v13zM5 17l3.5-4.5 2.5 3.01L14.5 11l4.5 6H5z" />
      </svg>
    ),
  },
  categories: {
    label: 'CATEGORIAS',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 19h20L12 2z" />
        <circle cx="12" cy="9" r="1.5" fill="white" />
      </svg>
    ),
  },
  products: {
    label: 'PRODUTOS',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
      </svg>
    ),
  },
  pages: {
    label: 'PÁGINAS',
    icon: pagesIcon,
  },
  users: {
    label: 'UTILIZADORES',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
  },
}

export const Dashboard: React.FC<AdminViewServerProps> = async ({ initPageResult }) => {
  const { req } = initPageResult
  const { payload } = req

  const visibleSlugs = new Set(Object.keys(collectionMeta))
  const collections = payload.config.collections.filter((col) => visibleSlugs.has(col.slug))

  return (
    <div className="custom-dashboard">
      <div className="custom-dashboard__header">
        <h1 className="custom-dashboard__title">COLEÇÕES</h1>
        <p className="custom-dashboard__subtitle">GESTÃO DE INVENTÁRIO</p>
      </div>
      <div className="custom-dashboard__grid">
        {collections.map((col) => {
          const meta = collectionMeta[col.slug]
          if (!meta) return null
          return (
            <div key={col.slug} className="custom-dashboard__card">
              <a href={`/admin/collections/${col.slug}`} className="custom-dashboard__card-icon">
                {meta.icon}
              </a>
              <h3 className="custom-dashboard__card-name">{meta.label}</h3>
              <a
                href={`/admin/collections/${col.slug}/create`}
                className="custom-dashboard__card-add"
              >
                +
              </a>
            </div>
          )
        })}
      </div>

      <div className="custom-dashboard__header" style={{ marginTop: 48 }}>
        <h1 className="custom-dashboard__title">CONFIGURAÇÃO</h1>
        <p className="custom-dashboard__subtitle">DEFINIÇÕES DO SITE E HOMEPAGE</p>
      </div>
      <div className="custom-dashboard__grid">
        {globalMeta.map((g) => (
          <div key={g.slug} className="custom-dashboard__card">
            <a href={g.href} className="custom-dashboard__card-icon">
              {g.icon}
            </a>
            <h3 className="custom-dashboard__card-name">{g.label}</h3>
            <a href={g.href} className="custom-dashboard__card-add">
              →
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
