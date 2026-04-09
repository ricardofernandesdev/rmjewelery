import type { GlobalConfig } from 'payload'
import { revalidatePath } from 'next/cache'

export const HomeSettings: GlobalConfig = {
  slug: 'home-settings',
  label: 'Homepage',
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
        revalidatePath('/', 'page')
      },
    ],
  },
  fields: [
    {
      name: 'sections',
      label: 'Secções da Homepage',
      type: 'blocks',
      admin: {
        description: 'Arrasta para reordenar as secções. Adiciona, remove ou desativa secções conforme necessário.',
      },
      blocks: [
        // ── Hero Block ──
        {
          slug: 'hero',
          labels: { singular: 'Hero', plural: 'Heroes' },
          fields: [
            {
              name: 'image',
              label: 'Imagem de fundo',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'showEyebrow',
              label: 'Mostrar eyebrow',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'eyebrow',
              label: 'Texto eyebrow',
              type: 'text',
              defaultValue: 'A COLEÇÃO 2026',
              admin: { condition: (_, sib) => Boolean(sib?.showEyebrow) },
            },
            {
              name: 'title',
              label: 'Título',
              type: 'text',
              defaultValue: 'Elegância Atemporal',
            },
            {
              name: 'showPrimaryButton',
              label: 'Mostrar botão primário',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'primaryButtonLabel',
              label: 'Botão primário — texto',
              type: 'text',
              defaultValue: 'EXPLORAR COLEÇÃO',
              admin: { condition: (_, sib) => Boolean(sib?.showPrimaryButton) },
            },
            {
              name: 'primaryButtonLink',
              label: 'Botão primário — link',
              type: 'text',
              defaultValue: '/products',
              admin: { condition: (_, sib) => Boolean(sib?.showPrimaryButton) },
            },
            {
              name: 'showSecondaryButton',
              label: 'Mostrar botão secundário',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'secondaryButtonLabel',
              label: 'Botão secundário — texto',
              type: 'text',
              defaultValue: 'VER LOOKBOOK',
              admin: { condition: (_, sib) => Boolean(sib?.showSecondaryButton) },
            },
            {
              name: 'secondaryButtonLink',
              label: 'Botão secundário — link',
              type: 'text',
              defaultValue: '/products',
              admin: { condition: (_, sib) => Boolean(sib?.showSecondaryButton) },
            },
          ],
        },
        // ── Categories Grid Block ──
        {
          slug: 'categoriesGrid',
          labels: { singular: 'Grelha de Categorias', plural: 'Grelhas de Categorias' },
          fields: [
            {
              name: 'title',
              label: 'Título',
              type: 'text',
              defaultValue: 'Dimensões Essenciais',
            },
            {
              name: 'description',
              label: 'Descrição',
              type: 'textarea',
              defaultValue:
                'Precisão geométrica encontra-se com permanência. A nossa coleção essencial define a interseção entre artesanato e elegância contemporânea.',
            },
            {
              name: 'label',
              label: 'Label (direita)',
              type: 'text',
              defaultValue: '01 / CATEGORIAS',
            },
          ],
        },
        // ── Philosophy Block ──
        {
          slug: 'philosophy',
          labels: { singular: 'Filosofia', plural: 'Filosofias' },
          fields: [
            {
              name: 'image',
              label: 'Imagem',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'showBadge',
              label: 'Mostrar badge',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'badge',
              label: 'Badge',
              type: 'text',
              defaultValue: 'COLEÇÃO 2026',
              admin: { condition: (_, sib) => Boolean(sib?.showBadge) },
            },
            {
              name: 'title',
              label: 'Título',
              type: 'text',
              defaultValue: 'Elegância que Perdura',
            },
            {
              name: 'text',
              label: 'Texto',
              type: 'textarea',
              defaultValue:
                'Selecionamos à mão cada peça da nossa coleção, dando preferência a materiais duradouros e desenhos intemporais. O nosso compromisso é trazer-te elegância que resiste ao tempo.',
            },
            {
              name: 'showLink',
              label: 'Mostrar link',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'linkLabel',
              label: 'Texto do link',
              type: 'text',
              defaultValue: 'Sobre Nós',
              admin: { condition: (_, sib) => Boolean(sib?.showLink) },
            },
            {
              name: 'linkUrl',
              label: 'URL do link',
              type: 'text',
              defaultValue: '/about',
              admin: { condition: (_, sib) => Boolean(sib?.showLink) },
            },
          ],
        },
        // ── Divider Block ──
        {
          slug: 'divider',
          labels: { singular: 'Divisor', plural: 'Divisores' },
          fields: [
            {
              name: 'style',
              label: 'Estilo',
              type: 'select',
              defaultValue: 'line',
              options: [
                { label: 'Linha fina', value: 'line' },
                { label: 'Espaço em branco', value: 'spacer' },
                { label: 'Linha com ornamento', value: 'ornament' },
              ],
            },
            {
              name: 'spacing',
              label: 'Espaçamento',
              type: 'select',
              defaultValue: 'medium',
              options: [
                { label: 'Pequeno', value: 'small' },
                { label: 'Médio', value: 'medium' },
                { label: 'Grande', value: 'large' },
              ],
            },
            {
              name: 'background',
              label: 'Cor de fundo',
              type: 'select',
              defaultValue: 'white',
              options: [
                { label: 'Branco', value: 'white' },
                { label: 'Cream', value: 'cream' },
                { label: 'Escuro', value: 'dark' },
              ],
            },
          ],
        },
        // ── Featured Products Gallery Block ──
        {
          slug: 'featuredProducts',
          labels: { singular: 'Produtos em Destaque', plural: 'Galerias de Produtos' },
          fields: [
            {
              name: 'eyebrow',
              label: 'Eyebrow',
              type: 'text',
              defaultValue: 'SELEÇÃO ESPECIAL',
            },
            {
              name: 'title',
              label: 'Título',
              type: 'text',
              defaultValue: 'Produtos em Destaque',
            },
            {
              name: 'products',
              label: 'Produtos',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
              admin: {
                description: 'Seleciona os produtos a mostrar na galeria horizontal.',
              },
            },
          ],
        },
      ],
    },
  ],
}
