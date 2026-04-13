import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'

export const maxDuration = 10

// ── Description templates per category ──
const descriptionTemplates: Record<string, [string, string]> = {
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

function detectCategory(sourceUrl: string, productName: string): string | null {
  const text = `${sourceUrl} ${productName}`.toLowerCase()
  if (text.includes('brinco')) return 'brincos'
  if (text.includes('colar')) return 'colares'
  if (text.includes('pulseira')) return 'pulseiras'
  if (text.includes('anel') || text.includes('aneis') || text.includes('anéis')) return 'aneis'
  return null
}

function buildDescription(productName: string, [para1, para2]: [string, string]) {
  const filled1 = para1.replace('{name}', productName)
  const filled2 = para2.replace('{name}', productName)
  const idx = filled1.indexOf(productName)
  const p1Children =
    idx >= 0
      ? [
          ...(idx > 0 ? [{ type: 'text', text: filled1.slice(0, idx), version: 1 }] : []),
          { type: 'text', text: productName, format: 1, version: 1 },
          ...(idx + productName.length < filled1.length
            ? [{ type: 'text', text: filled1.slice(idx + productName.length), version: 1 }]
            : []),
        ]
      : [{ type: 'text', text: filled1, version: 1 }]
  return {
    root: {
      type: 'root',
      children: [
        { type: 'paragraph', children: p1Children, direction: 'ltr', format: '', indent: 0, version: 1 },
        { type: 'paragraph', children: [{ type: 'text', text: filled2, version: 1 }], direction: 'ltr', format: '', indent: 0, version: 1 },
      ],
      direction: 'ltr', format: '', indent: 0, version: 1,
    },
  }
}

/**
 * Create the product WITHOUT images. Images are uploaded separately
 * via /api/import-shebiju/upload-image one at a time.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload()
    const hdrs = await headers()
    const { user } = await payload.auth({ headers: hdrs })
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { name, ref, colors, price, categoryId, sourceUrl } = await req.json()
    if (!name && !ref) return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 })

    const productName = name || ref || 'Produto Importado'
    const slug = (ref || name || 'produto').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const detectedCat = detectCategory(sourceUrl || '', productName)
    const template = detectedCat ? descriptionTemplates[detectedCat] : null
    const description = template ? buildDescription(productName, template) : undefined

    const productData: any = {
      name: productName,
      slug,
      images: [],
      price: price || 0,
      availability: 'in_stock',
      enableColors: (colors || []).length > 0,
      enableSizes: false,
      ...(description ? { description } : {}),
    }
    if (categoryId) productData.category = categoryId

    const product = await payload.create({ collection: 'products', data: productData })

    return NextResponse.json({
      success: true,
      productId: product.id,
      detectedCategory: detectedCat,
    })
  } catch (err: any) {
    console.error('Create error:', err)
    return NextResponse.json({ error: err.message || 'Erro ao criar produto' }, { status: 500 })
  }
}
