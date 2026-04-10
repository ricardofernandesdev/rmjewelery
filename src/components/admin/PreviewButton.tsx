'use client'
import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

const siteUrl = typeof window !== 'undefined'
  ? window.location.origin.replace('/admin', '')
  : ''

export const ProductPreviewButton: React.FC = () => {
  const { id, initialData } = useDocumentInfo()
  const slug = (initialData as any)?.slug

  if (!id || !slug) return null

  return (
    <a
      href={`${siteUrl}/products/${slug}`}
      target="_blank"
      rel="noopener noreferrer"
      title="Ver no frontend"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 12px',
        fontSize: '13px',
        color: 'var(--theme-text)',
        border: '1px solid var(--theme-elevation-200)',
        borderRadius: '4px',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--theme-elevation-50)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
      </svg>
      Ver
    </a>
  )
}

export const CategoryPreviewButton: React.FC = () => {
  const { id, initialData } = useDocumentInfo()
  const slug = (initialData as any)?.slug

  if (!id || !slug) return null

  return (
    <a
      href={`${siteUrl}/categories/${slug}`}
      target="_blank"
      rel="noopener noreferrer"
      title="Ver no frontend"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 12px',
        fontSize: '13px',
        color: 'var(--theme-text)',
        border: '1px solid var(--theme-elevation-200)',
        borderRadius: '4px',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--theme-elevation-50)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
      </svg>
      Ver
    </a>
  )
}

export const PagePreviewButton: React.FC = () => {
  const { id, initialData } = useDocumentInfo()
  const slug = (initialData as any)?.slug

  if (!id || !slug) return null

  return (
    <a
      href={`${siteUrl}/${slug}`}
      target="_blank"
      rel="noopener noreferrer"
      title="Ver no frontend"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 12px',
        fontSize: '13px',
        color: 'var(--theme-text)',
        border: '1px solid var(--theme-elevation-200)',
        borderRadius: '4px',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--theme-elevation-50)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
      </svg>
      Ver
    </a>
  )
}
