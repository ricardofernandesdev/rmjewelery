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
        description: 'Define as cores do produto. Arrasta para reordenar.',
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
          name: 'images',
          label: 'Imagens desta cor',
          type: 'upload',
          relationTo: 'media',
          hasMany: true,
          admin: {
            description: 'Imagens específicas desta cor. Se vazio, usa as imagens principais.',
          },
        },
      ],
    },
    // ── Tamanhos ──
    {
      name: 'enableSizes',
      label: 'Ativar tamanhos',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'sizes',
      label: 'Tamanhos disponíveis',
      type: 'array',
      admin: {
        description: 'Define os tamanhos do produto.',
        condition: (data) => Boolean(data?.enableSizes),
      },
      fields: [
        {
          name: 'value',
          label: 'Tamanho',
          type: 'text',
          required: true,
          admin: { description: 'Ex: 17, 18, 19, S, M, L' },
        },
      ],
    },
    // ── Variantes (combinações) ──
    {
      name: 'variants',
      label: 'Variantes (combinações)',
      type: 'array',
      admin: {
        description: 'Cria uma linha para cada combinação de cor/tamanho que queres vender. Só preenche se quiseres preço diferente ou marcar como esgotado.',
        condition: (data) => Boolean(data?.enableColors || data?.enableSizes),
      },
      fields: [
        {
          name: 'color',
          label: 'Cor',
          type: 'text',
          admin: {
            description: 'Nome exacto da cor (ex: Prata). Deixa vazio se não tiver cores.',
          },
        },
        {
          name: 'size',
          label: 'Tamanho',
          type: 'text',
          admin: {
            description: 'Tamanho exacto (ex: 17). Deixa vazio se não tiver tamanhos.',
          },
        },
        {
          name: 'price',
          label: 'Preço (override)',
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
