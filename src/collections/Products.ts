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
    {
      name: 'variants',
      label: 'Variantes',
      type: 'array',
      admin: {
        description: 'Adiciona variantes ao produto (ex: cores, tamanhos). Arrasta para reordenar.',
      },
      fields: [
        {
          name: 'name',
          label: 'Nome da variante',
          type: 'text',
          required: true,
          admin: {
            description: 'Ex: Prata, Dourado, Rose Gold, Tamanho S, etc.',
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
          label: 'Imagens da variante',
          type: 'upload',
          relationTo: 'media',
          hasMany: true,
          admin: {
            description: 'Imagens específicas desta variante. Se vazio, usa as imagens principais.',
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
