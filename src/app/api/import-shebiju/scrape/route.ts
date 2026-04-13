import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'

export const maxDuration = 10

/**
 * Scrape a Shebiju product page using Jina Reader (r.jina.ai) which
 * renders JavaScript and returns the full HTML. No Puppeteer needed,
 * so this runs well within the 10s Vercel free-tier timeout.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload()
    const hdrs = await headers()
    const { user } = await payload.auth({ headers: hdrs })
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { url } = await req.json()
    if (!url || !url.includes('shebiju.pt')) {
      return NextResponse.json({ error: 'URL inválido' }, { status: 400 })
    }

    // Use Jina Reader to get the JS-rendered HTML
    const jinaUrl = `https://r.jina.ai/${url}`
    const jinaRes = await fetch(jinaUrl, {
      headers: {
        Accept: 'text/html',
        'X-Return-Format': 'html',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!jinaRes.ok) {
      return NextResponse.json(
        { error: `Jina Reader devolveu status ${jinaRes.status}` },
        { status: 502 },
      )
    }

    const html = await jinaRes.text()

    // Parse the HTML to extract product data
    const productData = extractProductData(html, url)

    if (!productData.name && !productData.ref) {
      return NextResponse.json(
        { error: 'Não foi possível extrair dados do produto.' },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: true, ...productData })
  } catch (err: any) {
    console.error('Scrape error:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao extrair dados' },
      { status: 500 },
    )
  }
}

function extractProductData(html: string, sourceUrl: string) {
  // Extract product name — look for text patterns
  let name = ''
  let ref = ''

  // Try to find product title in common patterns
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  const h2Match = html.match(/<h2[^>]*>([^<]+)<\/h2>/i)
  const titleText = h1Match?.[1]?.trim() || h2Match?.[1]?.trim() || ''

  if (titleText) {
    name = titleText
    const refMatch = name.match(/([A-Z]{2,}[\d]+[\w.]*)/i)
    ref = refMatch ? refMatch[1] : ''
    if (ref && name.includes(ref)) {
      name = name.replace(ref, '').trim()
    }
    name = name.replace(/^[\s\-–.]+|[\s\-–.]+$/g, '').trim()
  }

  // Extract image URLs — only .jpg/.jpeg (skip .webp)
  const imageUrls: string[] = []

  function addImage(src: string) {
    if (!src || src.includes('fill.gif') || src.includes('fill_imagem')) return
    // Only keep jpg/jpeg
    if (!src.match(/\.jpe?g/i)) return
    const fullUrl = src.startsWith('http') ? src : `https://www.shebiju.pt${src.startsWith('/') ? '' : '/'}${src}`
    if (!imageUrls.includes(fullUrl)) imageUrls.push(fullUrl)
  }

  // Product images from img tags
  const imgRegex = /(?:src|data-src|data-lazy|data-original)=["']([^"']*?(?:produto|product)[^"']*?)["']/gi
  let imgMatch
  while ((imgMatch = imgRegex.exec(html)) !== null) addImage(imgMatch[1])

  // Background images
  const bgRegex = /background-image:\s*url\(["']?([^"')]*?(?:produto|product)[^"')]*?)["']?\)/gi
  let bgMatch
  while ((bgMatch = bgRegex.exec(html)) !== null) addImage(bgMatch[1])

  // Broader fallback if nothing found
  if (imageUrls.length === 0) {
    const broadImgRegex = /(?:src|data-src)=["'](https?:\/\/[^"']*?\.jpe?g[^"']*?)["']/gi
    let broadMatch
    while ((broadMatch = broadImgRegex.exec(html)) !== null) {
      const src = broadMatch[1]
      if (
        src &&
        !src.includes('fill.gif') && !src.includes('logo') &&
        !src.includes('icon') && !src.includes('pme') &&
        !src.includes('carrinho') && !src.includes('appstore') &&
        !src.includes('playstore') && !src.includes('wechat') &&
        !imageUrls.includes(src)
      ) {
        imageUrls.push(src)
      }
    }
  }

  // Extract colors
  const colors: string[] = []
  const colorPatterns = [
    /title=["'](Dourado|Prateado|Rose Gold|Preto|Branco)["']/gi,
    /data-cor=["']([^"']+)["']/gi,
    /class=["'][^"']*cor[^"']*["'][^>]*>([^<]{2,20})</gi,
  ]
  for (const pattern of colorPatterns) {
    let colorMatch
    while ((colorMatch = pattern.exec(html)) !== null) {
      const color = colorMatch[1].trim()
      if (color && !colors.includes(color) && color.length < 30) {
        colors.push(color)
      }
    }
  }

  // If no colors found via attributes, check for common color text near product
  if (colors.length === 0) {
    if (/dourado/i.test(html)) colors.push('Dourado')
    if (/prateado/i.test(html)) colors.push('Prateado')
  }

  // Price
  let price = 0
  const priceMatch = html.match(/(?:preço|price|preco|€)\s*[:\s]*(\d+[.,]\d+)/i)
  if (priceMatch) {
    price = parseFloat(priceMatch[1].replace(',', '.'))
  }

  return { name, ref, description: '', imageUrls, colors, price }
}
