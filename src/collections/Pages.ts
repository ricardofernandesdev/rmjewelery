import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'

const isAdmin = ({ req }: { req: any }) => Boolean(req.user)

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: 'Página',
    plural: 'Páginas',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'published', 'updatedAt'],
    preview: (doc) => `/${doc.slug}`,
    components: {
      edit: {
        PreviewButton: './src/components/admin/PreviewButton#PagePreviewButton',
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
    afterChange: [
      ({ doc }) => {
        if (doc.slug) {
          revalidatePath(`/${doc.slug}`)
        }
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'title',
      label: 'Título',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      label: 'Slug (URL)',
      type: 'text',
      unique: true,
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Ex: about, care-guide, ring-size-guide',
      },
    },
    {
      name: 'published',
      label: 'Publicada',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'content',
      label: 'Conteúdo',
      type: 'richText',
      required: true,
    },
  ],
}
