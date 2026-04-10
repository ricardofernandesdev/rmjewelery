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
}

// Categories config
const categoriesConfig: CollectionListConfig = {
  title: 'CATEGORIAS',
  subtitle: 'GESTÃO DE CATEGORIAS',
  slug: 'categories',
  createLabel: 'NOVA CATEGORIA',
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
  columns: [
    { key: 'name', label: 'NOME' },
    { key: 'slug', label: 'SLUG' },
    { key: 'category', label: 'CATEGORIA' },
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
  users: usersConfig,
}

export const CategoriesList: React.FC<ListViewServerProps> = async (props) => {
  return renderList(props, 'categories')
}

export const ProductsList: React.FC<ListViewServerProps> = async (props) => {
  return renderList(props, 'products')
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

  const serializedDocs = await Promise.all(
    docs.map(async (doc: any) => {
      const row: any = { id: doc.id }
      for (const col of config.columns) {
        if (col.key === 'image') {
          if (typeof doc.image === 'object' && doc.image) {
            row._imageUrl = doc.image.sizes?.thumbnail?.url || doc.image.url || ''
          } else if (doc.image) {
            // image is just an ID — resolve via Payload API
            try {
              const payload = await getPayloadClient()
              const media = await payload.findByID({
                collection: 'media',
                id: doc.image,
                depth: 0,
              })
              row._imageUrl = media?.sizes?.thumbnail?.url || media?.url || ''
            } catch {
              row._imageUrl = ''
            }
          } else {
            row._imageUrl = ''
          }
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
