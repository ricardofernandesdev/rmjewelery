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
      required: true,
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
    // ══════════════════════════════════════════
    // PASSO 1 — Atributos (escolher quais)
    // ══════════════════════════════════════════
    {
      name: 'enableColors',
      label: 'Atributo: Cor',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'enableSizes',
      label: 'Atributo: Tamanho',
      type: 'checkbox',
      defaultValue: false,
    },
    // ══════════════════════════════════════════
    // PASSO 2 — Termos (escolher valores globais)
    // ══════════════════════════════════════════
    {
      name: 'colors',
      label: 'Passo 2 — Cores disponíveis',
      type: 'relationship',
      relationTo: 'colors',
      hasMany: true,
      admin: {
        description: 'Escolhe as cores deste produto a partir da biblioteca global. Gere a biblioteca em "Cores" no menu lateral.',
        condition: (data) => Boolean(data?.enableColors),
        components: {
          Field: './src/components/admin/ProductColorsField#ProductColorsField',
        },
      },
    },
    {
      name: 'sizeTerms',
      label: 'Passo 2 — Termos de Tamanho',
      type: 'array',
      admin: {
        description: 'Define os tamanhos disponíveis.',
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
    // ══════════════════════════════════════════
    // PASSO 3 — Variantes (combinações)
    // ══════════════════════════════════════════
    {
      name: 'variants',
      label: 'Passo 3 — Variantes',
      type: 'array',
      admin: {
        description: 'Cria uma variante para cada combinação. Usa os nomes exactos dos termos definidos acima.',
        condition: (data) => Boolean(data?.enableColors || data?.enableSizes),
      },
      fields: [
        {
          name: 'color',
          label: 'Cor',
          type: 'text',
          admin: {
            condition: (data) => Boolean(data?.enableColors),
            components: {
              Field: './src/components/admin/VariantColorSelect#VariantColorSelect',
            },
          },
        },
        {
          name: 'size',
          label: 'Tamanho',
          type: 'text',
          admin: {
            condition: (data) => Boolean(data?.enableSizes),
            components: {
              Field: './src/components/admin/VariantSizeSelect#VariantSizeSelect',
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
          label: 'Imagens desta variante',
          type: 'upload',
          relationTo: 'media',
          hasMany: true,
          admin: {
            description: 'Se vazio, usa as imagens da cor ou as principais.',
          },
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
