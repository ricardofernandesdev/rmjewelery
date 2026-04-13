import React from 'react'
import type { ListViewServerProps } from 'payload'
import { getPayload as getPayloadClient } from '@/lib/payload'
import { CollectionListClient } from './CollectionListClient'
import './MediaList.scss'

type ColumnDef = {
  key: string
  label: string
  render?: (doc: any) => React.ReactNode
}

type CollectionListConfig = {
  title: string
  subtitle: string
  slug: string
  createLabel: string
  columns: ColumnDef[]
  previewPrefix?: string
}

// Categories config
const categoriesConfig: CollectionListConfig = {
  title: 'CATEGORIAS',
  subtitle: 'GESTÃO DE CATEGORIAS',
  slug: 'categories',
  createLabel: 'NOVA CATEGORIA',
  previewPrefix: '/categories',
  columns: [
    {
      key: 'image',
      label: 'IMAGEM',
    },
    { key: 'name', label: 'NOME' },
    { key: 'slug', label: 'SLUG' },
    { key: 'description', label: 'DESCRIÇÃO' },
  ],
}

// Products config
const productsConfig: CollectionListConfig = {
  title: 'PRODUTOS',
  subtitle: 'GESTÃO DE PRODUTOS',
  slug: 'products',
  createLabel: 'NOVO PRODUTO',
  previewPrefix: '/products',
  columns: [
    { key: 'thumbnail', label: 'IMAGEM' },
    { key: 'name', label: 'NOME' },
    { key: 'slug', label: 'SLUG' },
    { key: 'category', label: 'CATEGORIA' },
  ],
}

// Colors config
const colorsConfig: CollectionListConfig = {
  title: 'CORES',
  subtitle: 'BIBLIOTECA DE CORES',
  slug: 'colors',
  createLabel: 'NOVA COR',
  columns: [
    { key: 'swatch', label: 'COR' },
    { key: 'name', label: 'NOME' },
    { key: 'hex', label: 'HEX' },
    { key: 'slug', label: 'SLUG' },
  ],
}

// Users config
const usersConfig: CollectionListConfig = {
  title: 'UTILIZADORES',
  subtitle: 'GESTÃO DE UTILIZADORES',
  slug: 'users',
  createLabel: 'NOVO UTILIZADOR',
  columns: [
    { key: 'email', label: 'EMAIL' },
    { key: 'name', label: 'NOME' },
  ],
}

const configMap: Record<string, CollectionListConfig> = {
  categories: categoriesConfig,
  products: productsConfig,
  colors: colorsConfig,
  users: usersConfig,
}

export const CategoriesList: React.FC<ListViewServerProps> = async (props) => {
  return renderList(props, 'categories')
}

export const ProductsList: React.FC<ListViewServerProps> = async (props) => {
  return renderList(props, 'products')
}

export const ColorsList: React.FC<ListViewServerProps> = async (props) => {
  return renderList(props, 'colors')
}

export const UsersList: React.FC<ListViewServerProps> = async (props) => {
  return renderList(props, 'users')
}

async function renderList(props: ListViewServerProps, slug: string) {
  const { data } = props
  const config = configMap[slug]
  const docs = (data as any)?.docs || []
  const totalDocs = (data as any)?.totalDocs || 0
  const totalPages = (data as any)?.totalPages || 1
  const currentPage = (data as any)?.page || 1

  // Get current user ID to protect from self-deletion
  const currentUserId = slug === 'users' ? (props as any)?.user?.id : undefined

  const resolveMediaUrl = async (raw: any): Promise<string> => {
    if (!raw) return ''
    if (typeof raw === 'object') {
      return raw.sizes?.thumbnail?.url || raw.url || ''
    }
    try {
      const payload = await getPayloadClient()
      const media = await payload.findByID({
        collection: 'media',
        id: raw,
        depth: 0,
      })
      return media?.sizes?.thumbnail?.url || media?.url || ''
    } catch {
      return ''
    }
  }

  const serializedDocs = await Promise.all(
    docs.map(async (doc: any) => {
      const row: any = { id: doc.id }
      for (const col of config.columns) {
        if (col.key === 'image') {
          row._imageUrl = await resolveMediaUrl(doc.image)
        } else if (col.key === 'thumbnail') {
          // First entry of the product's `images` upload field
          const first = Array.isArray(doc.images) && doc.images.length > 0 ? doc.images[0] : null
          row._thumbnailUrl = await resolveMediaUrl(first)
        } else if (col.key === 'swatch') {
          row._swatchHex = doc.hex || '#cccccc'
        } else if (col.key === 'category') {
          row.category =
            typeof doc.category === 'object' && doc.category ? doc.category.name : doc.category || ''
        } else {
          row[col.key] = doc[col.key] || ''
        }
      }
      return row
    }),
  )

  return (
    <CollectionListClient
      docs={serializedDocs}
      totalDocs={totalDocs}
      totalPages={totalPages}
      currentPage={currentPage}
      config={config}
      protectedIds={currentUserId ? [String(currentUserId)] : []}
    />
  )
}
