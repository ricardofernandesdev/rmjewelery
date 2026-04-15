import type { CollectionConfig } from 'payload'
import { formatSlug } from '@/lib/slugFormat'
import { isAdmin } from '@/lib/access'

export const Colors: CollectionConfig = {
  slug: 'colors',
  labels: {
    singular: 'Cor',
    plural: 'Cores',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'hex', 'slug'],
    components: {
      views: {
        list: {
          Component: './src/components/admin/CollectionList#ColorsList',
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
        description: 'Nome apresentado (ex.: Prateado, Dourado, Rose Gold).',
      },
    },
    {
      name: 'hex',
      label: 'Cor',
      type: 'text',
      required: true,
      defaultValue: '#C0C0C0',
      admin: {
        components: {
          Field: './src/components/admin/ColorPickerField#ColorPickerField',
        },
      },
    },
    {
      name: 'autoSelect',
      label: 'Seleção automática',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Se ativo, esta cor é pré-selecionada em novos produtos e os importadores criam automaticamente uma variante para ela.',
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
