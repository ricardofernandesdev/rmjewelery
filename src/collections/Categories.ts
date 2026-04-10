import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { formatSlug } from '@/lib/slugFormat'
import { isAdmin } from '@/lib/access'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Categoria',
    plural: 'Categorias',
  },
  admin: {
    useAsTitle: 'name',
    components: {
      edit: {
        PreviewButton: './src/components/admin/PreviewButton#CategoryPreviewButton',
      },
      views: {
        list: {
          Component: './src/components/admin/CollectionList#CategoriesList',
        },
      },
    },
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (operation === 'create' && data && !data.slug && data.name) {
          data.slug = formatSlug(data.name)
        }
        return data
      },
    ],
    afterChange: [
      ({ doc }) => {
        revalidatePath(`/categories/${doc.slug}`)
        revalidatePath('/products')
        revalidatePath('/')
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'bannerPositionX',
      label: 'Posição horizontal do banner',
      type: 'select',
      defaultValue: 'center',
      options: [
        { label: 'Esquerda', value: 'left' },
        { label: 'Centro', value: 'center' },
        { label: 'Direita', value: 'right' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Ajusta o foco horizontal da imagem no banner.',
      },
    },
    {
      name: 'bannerPositionY',
      label: 'Posição vertical do banner',
      type: 'select',
      defaultValue: 'center',
      options: [
        { label: 'Topo', value: 'top' },
        { label: 'Centro', value: 'center' },
        { label: 'Baixo', value: 'bottom' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Ajusta o foco vertical da imagem no banner.',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
