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
    const productData = extractProductData(html)

    if (!productData.name && !productData.ref) {
      return NextResponse.json(
        { error: 'Não foi possível extrair dados do produto.' },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: true, ...productData })
  } catch (err: any) {
    console.error('Scrape error:', err)
    return NextResponse.json({ error: err.message || 'Erro ao extrair dados' }, { status: 500 })
  }
}

function extractProductData(html: string) {
  // ── Product name ──
  let name = ''
  let ref = ''
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  const titleText = h1Match?.[1]?.trim() || ''

  if (titleText) {
    name = titleText
    const refMatch = name.match(/([A-Z]{2,}[\d]+[\w.]*)/i)
    ref = refMatch ? refMatch[1] : ''
    if (ref && name.includes(ref)) {
      name = name.replace(ref, '').trim()
    }
    name = name.replace(/^[\s\-–.]+|[\s\-–.]+$/g, '').trim()
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

  return { name, ref, description: '', imageUrls, colors, price }
}
