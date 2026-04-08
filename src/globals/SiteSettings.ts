import type { GlobalConfig } from 'payload'
import { revalidatePath } from 'next/cache'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Definições do Site',
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
      name: 'logo',
      label: 'Logo do Site',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Logo apresentado no header do site público.',
      },
    },
    {
      name: 'heroImage',
      label: 'Imagem do Hero (Homepage)',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Imagem de fundo do banner principal da homepage.',
      },
    },
    {
      name: 'heroTitle',
      label: 'Título do Hero',
      type: 'text',
      defaultValue: 'Explore os nossos produtos',
    },
    {
      name: 'heroButtonLabel',
      label: 'Texto do Botão do Hero',
      type: 'text',
      defaultValue: 'VER CATÁLOGO COMPLETO',
    },
    {
      name: 'maintenanceMode',
      label: 'Modo Manutenção',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Ativa o modo manutenção. O site público fica indisponível e mostra a página de manutenção.',
      },
    },
    {
      name: 'maintenanceMessage',
      label: 'Mensagem de Manutenção',
      type: 'textarea',
      defaultValue: 'Estamos a fazer melhorias. Voltamos em breve.',
      admin: {
        condition: (data) => Boolean(data?.maintenanceMode),
      },
    },
    {
      name: 'comingSoon',
      label: 'Modo Coming Soon',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Mostra uma página "Em breve" no site público. Útil antes do lançamento.',
      },
    },
    {
      name: 'comingSoonMessage',
      label: 'Mensagem Coming Soon',
      type: 'textarea',
      defaultValue: 'Estamos a preparar algo especial. Em breve.',
      admin: {
        condition: (data) => Boolean(data?.comingSoon),
      },
    },
  ],
}
