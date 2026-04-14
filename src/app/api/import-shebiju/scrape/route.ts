import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'

export const maxDuration = 10

/**
 * Scrape a Shebiju product page via direct HTTP fetch (no browser needed).
 * Product images are extracted from elements with class "img_big" and
 * their "big" attribute which holds the full-size .png URL.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload()
    const hdrs = await headers()
    const { user } = await payload.auth({ headers: hdrs })
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { url } = await req.json()
    if (!url || !url.includes('shebiju.pt')) {
      return NextResponse.json({ error: 'URL inválido' }, { status: 400 })
    }

    // Direct fetch — no Jina Reader needed, the data is in the static HTML
    const pageRes = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!pageRes.ok) {
      return NextResponse.json({ error: `Página devolveu status ${pageRes.status}` }, { status: 502 })
    }

    const html = await pageRes.text()
    const productData = extractProductData(html, url)

    if (!productData.name && !productData.ref) {
      return NextResponse.json(
        { error: 'Não foi possível extrair dados do produto.' },
        { status: 400 },
      )
    }

    // Name improvement now happens via the /enhance endpoint which uses
    // Gemini with vision — called by the client after upload.
    return NextResponse.json({ success: true, ...productData })
  } catch (err: any) {
    console.error('Scrape error:', err)
    return NextResponse.json({ error: err.message || 'Erro ao extrair dados' }, { status: 500 })
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function extractProductData(html: string, url: string) {
  // ── Product name ──
  let name = ''
  let ref = ''
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  const titleText = h1Match?.[1]?.trim() ? decodeHtmlEntities(h1Match[1].trim()) : ''

  if (titleText) {
    name = titleText
    // Try to extract ref from the product name first
    const refMatch = name.match(/([A-Z]{2,}[\d]+[\w.]*)/i)
    ref = refMatch ? refMatch[1] : ''
    if (ref && name.includes(ref)) {
      name = name.replace(ref, '').trim()
    }
    name = name.replace(/^[\s\-–.]+|[\s\-–.]+$/g, '').trim()
  }

  // If no ref in the title, extract from the .detalhe_ref element
  if (!ref) {
    const detRefMatch = html.match(/detalhe_ref[^>]*>([^<]+)</i)
    if (detRefMatch) {
      ref = decodeHtmlEntities(detRefMatch[1].trim())
    }
  }

  // ── Images from .img_big[big] attribute — full-size .png URLs ──
  const imageUrls: string[] = []
  // Match big="..." on elements that have class img_big (either order)
  const bigRegex1 = /class=["'][^"']*img_big[^"']*["'][^>]*big=["']([^"']+)["']/gi
  const bigRegex2 = /big=["']([^"']+)["'][^>]*class=["'][^"']*img_big/gi
  const seen = new Set<string>()

  for (const regex of [bigRegex1, bigRegex2]) {
    let m
    while ((m = regex.exec(html)) !== null) {
      const imgUrl = m[1]
      if (imgUrl && !seen.has(imgUrl)) {
        seen.add(imgUrl)
        imageUrls.push(imgUrl)
      }
    }
  }

  // ── Colors ──
  const colors: string[] = []
  const colorRegex = /title=["'](Dourado|Prateado|Rose Gold|Preto|Branco)["']/gi
  let colorMatch
  while ((colorMatch = colorRegex.exec(html)) !== null) {
    const color = colorMatch[1]
    if (!colors.includes(color)) colors.push(color)
  }
  // Fallback text search
  if (colors.length === 0) {
    if (/dourado/i.test(html)) colors.push('Dourado')
    if (/prateado/i.test(html)) colors.push('Prateado')
  }

  // ── Price ──
  let price = 0
  const priceMatch = html.match(/(?:preço|price|€)\s*[:\s]*(\d+[.,]\d+)/i)
  if (priceMatch) {
    price = parseFloat(priceMatch[1].replace(',', '.'))
  }

  // ── Auto-generate description based on category ──
  const description = buildDescription(name || ref, url)

  return { name, ref, description, imageUrls, colors, price }
}

// ── Description templates per category ──
const templates: Record<string, [string, string]> = {
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

function buildDescription(productName: string, sourceUrl: string): any | null {
  const cat = detectCategory(sourceUrl, productName)
  if (!cat || !templates[cat]) return null

  const [para1Raw, para2Raw] = templates[cat]
  const para1 = para1Raw.replace('{name}', productName)
  const para2 = para2Raw.replace('{name}', productName)

  const idx = para1.indexOf(productName)
  const p1Children =
    idx >= 0
      ? [
          ...(idx > 0 ? [{ type: 'text', text: para1.slice(0, idx), version: 1 }] : []),
          { type: 'text', text: productName, format: 1, version: 1 },
          ...(idx + productName.length < para1.length
            ? [{ type: 'text', text: para1.slice(idx + productName.length), version: 1 }]
            : []),
        ]
      : [{ type: 'text', text: para1, version: 1 }]

  return {
    root: {
      type: 'root',
      children: [
        { type: 'paragraph', children: p1Children, direction: 'ltr', format: '', indent: 0, version: 1 },
        { type: 'paragraph', children: [{ type: 'text', text: para2, version: 1 }], direction: 'ltr', format: '', indent: 0, version: 1 },
      ],
      direction: 'ltr', format: '', indent: 0, version: 1,
    },
  }
}
