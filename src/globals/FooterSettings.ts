import type { GlobalConfig } from 'payload'
import { revalidatePath } from 'next/cache'

export const FooterSettings: GlobalConfig = {
  slug: 'footer-settings',
  label: 'Footer',
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  admin: {
    group: 'Configuração',
  },
  hooks: {
    afterChange: [
      () => {
        revalidatePath('/', 'layout')
      },
    ],
  },
  fields: [
    {
      name: 'columns',
      label: 'Colunas do Footer',
      type: 'array',
      admin: {
        description: 'Arrasta para reordenar as colunas.',
      },
      fields: [
        {
          name: 'title',
          label: 'Título',
          type: 'text',
          required: true,
        },
        {
          name: 'links',
          label: 'Links',
          type: 'array',
          fields: [
            {
              name: 'label',
              label: 'Texto',
              type: 'text',
              required: true,
            },
            {
              name: 'url',
              label: 'URL',
              type: 'text',
              required: true,
            },
            {
              name: 'newTab',
              label: 'Abrir em nova aba',
              type: 'checkbox',
              defaultValue: false,
            },
          ],
        },
      ],
    },
    {
      name: 'copyright',
      label: 'Texto copyright',
      type: 'text',
      defaultValue: '© {year} R&M Jewelry. Todos os direitos reservados.',
      admin: {
        description: 'Use {year} para o ano atual.',
      },
    },
  ],
}
