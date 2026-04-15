import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { formatSlug } from '@/lib/slugFormat'
import { isAdmin } from '@/lib/access'

// ── Auto-description templates per category ──
const descTemplates: Record<string, [string, string]> = {
  brincos: [
    'Os {name} foram concebidos para realçar o rosto com suavidade e brilho, ideais para quem procura acessórios discretos, mas cheios de charme. O seu design moderno acrescenta equilíbrio e luminosidade ao visual, tornando-os perfeitos para todas as ocasiões.',
    'Seja para o dia a dia ou para complementar um look especial, estes brincos conferem um toque de elegância intuitiva que não passa despercebida — um verdadeiro clássico contemporâneo.',
  ],
  colares: [
    'O {name} foi desenhado para adornar o pescoço com delicadeza e sofisticação, ideal para quem valoriza peças que combinam elegância e versatilidade. O seu design cuidado realça qualquer decote, acrescentando um toque de luminosidade ao visual.',
    'Perfeito tanto para ocasiões especiais como para o uso diário, este colar é a escolha ideal para quem procura um acessório que se destaca pela sua simplicidade refinada — uma peça intemporal que complementa qualquer estilo.',
  ],
  pulseiras: [
    'A {name} foi criada para envolver o pulso com elegância e subtileza, perfeita para quem procura um acessório que alia design moderno a um conforto excepcional. O seu acabamento cuidado reflete a luz de forma delicada, acrescentando um brilho discreto ao visual.',
    'Seja usada sozinha ou combinada com outras peças, esta pulseira adapta-se a qualquer ocasião — do dia a dia aos momentos mais especiais. Um acessório versátil que se torna rapidamente indispensável.',
  ],
  aneis: [
    'O {name} foi concebido para adornar os dedos com elegância e personalidade, ideal para quem procura peças que se destacam pela sua beleza discreta. O seu design harmonioso combina modernidade e atemporalidade, tornando-o perfeito para qualquer ocasião.',
    'Seja para uso diário ou para complementar um look mais elaborado, este anel confere um toque de sofisticação que não passa despercebido — uma peça que se torna parte da sua identidade.',
  ],
}

function detectCategoryFromName(name: string): string | null {
  const lower = name.toLowerCase()
  if (lower.includes('brinco')) return 'brincos'
  if (lower.includes('colar')) return 'colares'
  if (lower.includes('pulseira')) return 'pulseiras'
  if (lower.includes('anel') || lower.includes('anéis')) return 'aneis'
  return null
}

function generateDescription(productName: string, category: string): any {
  const [p1Raw, p2Raw] = descTemplates[category]
  const p1 = p1Raw.replace('{name}', productName)
  const p2 = p2Raw.replace('{name}', productName)
  const idx = p1.indexOf(productName)
  const children =
    idx >= 0
      ? [
          ...(idx > 0 ? [{ type: 'text', text: p1.slice(0, idx), version: 1 }] : []),
          { type: 'text', text: productName, format: 1, version: 1 },
          ...(idx + productName.length < p1.length
            ? [{ type: 'text', text: p1.slice(idx + productName.length), version: 1 }]
            : []),
        ]
      : [{ type: 'text', text: p1, version: 1 }]

  return {
    root: {
      type: 'root',
      children: [
        { type: 'paragraph', children, direction: 'ltr', format: '', indent: 0, version: 1 },
        { type: 'paragraph', children: [{ type: 'text', text: p2, version: 1 }], direction: 'ltr', format: '', indent: 0, version: 1 },
      ],
      direction: 'ltr', format: '', indent: 0, version: 1,
    },
  }
}

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'Produto',
    plural: 'Produtos',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'createdAt'],
    preview: (doc) => `/products/${doc.slug}`,
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
        if (!data) return data
        // Auto-generate slug on create if empty
        if (operation === 'create' && !data.slug && data.name) {
          data.slug = formatSlug(data.name)
        }
        // Auto-generate description on create if empty
        if (operation === 'create' && data.name && !data.description) {
          const cat = detectCategoryFromName(data.name)
          if (cat && descTemplates[cat]) {
            data.description = generateDescription(data.name, cat)
          }
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
      name: 'shebijuImport',
      type: 'ui',
      admin: {
        components: {
          Field: './src/components/admin/ShebijuImport#ShebijuImport',
        },
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        components: {
          afterInput: ['./src/components/admin/NameImproveButton#NameImproveButton'],
        },
      },
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
      admin: {
        components: {
          afterInput: ['./src/components/admin/DescriptionGenerateButton#DescriptionGenerateButton'],
        },
      },
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
      name: 'sizes',
      label: 'Passo 2 — Tamanhos disponíveis',
      type: 'relationship',
      relationTo: 'sizes',
      hasMany: true,
      admin: {
        description:
          'Escolhe os tamanhos deste produto a partir da biblioteca global. Gere a biblioteca em "Tamanhos" no menu lateral.',
        condition: (data) => Boolean(data?.enableSizes),
        components: {
          Field: './src/components/admin/ProductSizesField#ProductSizesField',
        },
      },
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
            components: {
              Field: './src/components/admin/VariantImagesPicker#VariantImagesPicker',
            },
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
