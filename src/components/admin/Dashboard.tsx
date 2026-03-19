import React from 'react'
import type { AdminViewServerProps } from 'payload'
import './Dashboard.scss'

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
    </div>
  )
}
