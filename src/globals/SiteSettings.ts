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
      name: 'instagramUrl',
      label: 'Link do Instagram (Direct)',
      type: 'text',
      defaultValue: 'https://ig.me/m/rmjewelry.collection',
      admin: {
        description: 'Para abrir diretamente o Direct do Instagram usa: https://ig.me/m/NOME_DO_PERFIL (sem a barra final). Exemplo: https://ig.me/m/rmjewelry.collection. Usado no botão "Estou interessado" nos produtos.',
      },
    },
    {
      name: 'instagramPageUrl',
      label: 'Página do Instagram',
      type: 'text',
      defaultValue: 'https://www.instagram.com/rmjewelry.collection/',
      admin: {
        description: 'URL do perfil do Instagram. Formato: https://www.instagram.com/NOME_DO_PERFIL/. Usado no footer.',
      },
    },
    {
      name: 'tiktokUrl',
      label: 'Página do TikTok',
      type: 'text',
      admin: {
        description: 'URL do perfil TikTok. Ex.: https://www.tiktok.com/@rmjewelry. Deixa vazio para esconder do footer.',
      },
    },
    {
      name: 'facebookUrl',
      label: 'Página do Facebook',
      type: 'text',
      admin: {
        description: 'URL da página do Facebook. Ex.: https://www.facebook.com/rmjewelry. Deixa vazio para esconder do footer.',
      },
    },
    {
      name: 'maintenanceMode',
      label: 'Modo Manutenção',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Ativa o modo manutenção. O site público fica indisponível para visitantes não autenticados.',
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
