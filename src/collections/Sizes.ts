import type { CollectionConfig } from 'payload'
import { formatSlug } from '@/lib/slugFormat'
import { isAdmin } from '@/lib/access'

export const Sizes: CollectionConfig = {
  slug: 'sizes',
  labels: {
    singular: 'Tamanho',
    plural: 'Tamanhos',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'autoSelect'],
    components: {
      views: {
        list: {
          Component: './src/components/admin/CollectionList#SizesList',
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
      ({ data }) => {
        if (data && !data.slug && data.name) {
          data.slug = formatSlug(data.name)
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      label: 'Nome',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Nome apresentado (ex.: 17, 18, S, M, L).',
      },
    },
    {
      name: 'autoSelect',
      label: 'Seleção automática',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Se ativo, este tamanho é pré-selecionado em novos produtos e os importadores criam automaticamente uma variante para ele.',
      },
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      unique: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
}
