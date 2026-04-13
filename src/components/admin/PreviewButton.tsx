'use client'
import React from 'react'
import { useDocumentInfo, useAllFormFields } from '@payloadcms/ui'

const btnStyle: React.CSSProperties = {
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
}

function PreviewLink({ prefix }: { prefix: string }) {
  const { id, initialData } = useDocumentInfo()

  // Try multiple sources for the slug
  let slug: string | undefined

  // 1. From initialData (works on first load)
  if (!slug && initialData && typeof initialData === 'object') {
    slug = (initialData as any).slug
  }

  // 2. From form fields (works after edits)
  try {
    const [fields] = useAllFormFields()
    if (!slug && fields?.slug?.value) {
      slug = fields.slug.value as string
    }
  } catch {
    // useAllFormFields may not be available in all contexts
  }

  if (!id || !slug) return null

  const href = `${prefix}/${slug}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Ver no frontend"
      style={btnStyle}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--theme-elevation-50)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
      </svg>
      Ver no site
    </a>
  )
}

export const ProductPreviewButton: React.FC = () => <PreviewLink prefix="/products" />
export const CategoryPreviewButton: React.FC = () => <PreviewLink prefix="/categories" />
export const PagePreviewButton: React.FC = () => <PreviewLink prefix="" />
