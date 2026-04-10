import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { formatSlug } from '@/lib/slugFormat'
import { isAdmin } from '@/lib/access'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'Produto',
    plural: 'Produtos',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'createdAt'],
    components: {
      edit: {
        PreviewButton: './src/components/admin/PreviewButton#ProductPreviewButton',
      },
      views: {
        list: {
          Component: './src/components/admin/CollectionList#ProductsList',
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
        revalidatePath(`/products/${doc.slug}`)
        revalidatePath('/products')
        revalidatePath('/')
        if (typeof doc.category === 'object' && doc.category?.slug) {
          revalidatePath(`/categories/${doc.category.slug}`)
        }
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
      type: 'richText',
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      admin: {
        isSortable: true,
      },
    },
    {
      name: 'price',
      label: 'Preço base',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        step: 0.01,
        description: 'Preço em euros (€). Se tiver variantes, este é o preço base mostrado na listagem.',
      },
    },
    {
      name: 'availability',
      label: 'Disponibilidade',
      type: 'select',
      defaultValue: 'in_stock',
      options: [
        { label: 'Em stock', value: 'in_stock' },
        { label: 'Esgotado', value: 'out_of_stock' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    // ── Cores ──
    {
      name: 'enableColors',
      label: 'Ativar cores',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'colors',
      label: 'Cores disponíveis',
      type: 'array',
      admin: {
        description: 'Define as cores do produto. Cada cor pode ter preço, disponibilidade e imagens próprias.',
        condition: (data) => Boolean(data?.enableColors),
      },
      fields: [
        {
          name: 'name',
          label: 'Nome',
          type: 'text',
          required: true,
          admin: { description: 'Ex: Prata, Dourado, Rose Gold' },
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
          name: 'price',
          label: 'Preço',
          type: 'number',
          min: 0,
          admin: {
            step: 0.01,
            description: 'Deixa vazio para usar o preço base.',
          },
        },
        {
          name: 'availability',
          label: 'Disponibilidade',
          type: 'select',
          defaultValue: 'in_stock',
          options: [
            { label: 'Em stock', value: 'in_stock' },
            { label: 'Esgotado', value: 'out_of_stock' },
          ],
        },
        {
          name: 'images',
          label: 'Imagens desta cor',
          type: 'upload',
          relationTo: 'media',
          hasMany: true,
          admin: {
            description: 'Imagens específicas desta cor. Se vazio, usa as imagens principais.',
          },
        },
        {
          name: 'sizes',
          label: 'Tamanhos desta cor',
          type: 'array',
          admin: {
            description: 'Define tamanhos e disponibilidade para esta cor.',
            condition: (_, siblingData) => {
              // Access root data to check enableSizes
              return true // Always show, visibility controlled by enableSizes at product level
            },
          },
          fields: [
            {
              name: 'value',
              label: 'Tamanho',
              type: 'text',
              required: true,
              admin: { description: 'Ex: 17, 18, 19' },
            },
            {
              name: 'price',
              label: 'Preço',
              type: 'number',
              min: 0,
              admin: {
                step: 0.01,
                description: 'Deixa vazio para usar o preço da cor ou base.',
              },
            },
            {
              name: 'availability',
              label: 'Disponibilidade',
              type: 'select',
              defaultValue: 'in_stock',
              options: [
                { label: 'Em stock', value: 'in_stock' },
                { label: 'Esgotado', value: 'out_of_stock' },
              ],
            },
          ],
        },
      ],
    },
    // ── Tamanhos (sem cores) ──
    {
      name: 'enableSizes',
      label: 'Ativar tamanhos',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Para tamanhos sem cores. Se tiver cores, define os tamanhos dentro de cada cor.',
      },
    },
    {
      name: 'sizes',
      label: 'Tamanhos disponíveis',
      type: 'array',
      admin: {
        description: 'Define os tamanhos quando não há cores. Se tiver cores, usa os tamanhos dentro de cada cor.',
        condition: (data) => Boolean(data?.enableSizes && !data?.enableColors),
      },
      fields: [
        {
          name: 'value',
          label: 'Tamanho',
          type: 'text',
          required: true,
          admin: { description: 'Ex: 17, 18, 19, S, M, L' },
        },
        {
          name: 'price',
          label: 'Preço',
          type: 'number',
          min: 0,
          admin: {
            step: 0.01,
            description: 'Deixa vazio para usar o preço base.',
          },
        },
        {
          name: 'availability',
          label: 'Disponibilidade',
          type: 'select',
          defaultValue: 'in_stock',
          options: [
            { label: 'Em stock', value: 'in_stock' },
            { label: 'Esgotado', value: 'out_of_stock' },
          ],
        },
      ],
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
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
