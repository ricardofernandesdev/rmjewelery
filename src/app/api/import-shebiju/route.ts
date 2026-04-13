import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'
import path from 'path'
import fs from 'fs'
import os from 'os'

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const payload = await getPayload()
    const hdrs = await headers()
    const { user } = await payload.auth({ headers: hdrs })
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { url, categoryId } = await req.json()
    if (!url || !url.includes('shebiju.pt')) {
      return NextResponse.json({ error: 'URL inválido. Deve ser um URL de shebiju.pt' }, { status: 400 })
    }

    // Puppeteer is a devDependency — only available locally.
    // Use createRequire to load it at runtime without webpack trying to
    // bundle it or TypeScript checking the module at build time.
    let puppeteer: any
    try {
      const { createRequire } = await import('node:module')
      const req = createRequire(import.meta.url)
      puppeteer = req('puppeteer')
    } catch {
      return NextResponse.json(
        { error: 'Puppeteer não disponível. Esta funcionalidade só funciona em ambiente local (dev).' },
        { status: 500 },
      )
    }

    // Launch browser and scrape
    const launch = puppeteer.launch || puppeteer.default?.launch
    const browser = await launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    )
    await page.setViewport({ width: 1280, height: 900 })
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

    // Wait for content to load
    await new Promise((r) => setTimeout(r, 3000))

    // Scroll to load lazy images
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0
        const distance = 300
        const timer = setInterval(() => {
          window.scrollBy(0, distance)
          totalHeight += distance
          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer)
            resolve()
          }
        }, 150)
      })
    })
    await new Promise((r) => setTimeout(r, 2000))

    // Extract product data
    const productData = await page.evaluate(() => {
      // Product name
      const nameEl = document.querySelector('h1, h2, .product-name, .product-title, [class*="product"][class*="name"]')
      let name = nameEl?.textContent?.trim() || ''

      // Reference — look for patterns like ABC123
      const refMatch = name.match(/([A-Z]{2,}[\d]+[\w.]*)/i)
      const ref = refMatch ? refMatch[1] : ''

      // Clean name (remove ref from name if present)
      if (ref && name.includes(ref)) {
        name = name.replace(ref, '').trim()
      }
      // Remove trailing/leading dashes, dots, spaces
      name = name.replace(/^[\s\-–.]+|[\s\-–.]+$/g, '').trim()

      // Description
      const descEl = document.querySelector(
        '.product-description, .description, [class*="descri"], [class*="detail"] p',
      )
      const description = descEl?.textContent?.trim() || ''

      // Images — all product images (not icons, logos, placeholders)
      const imageUrls: string[] = []
      const allImgs = document.querySelectorAll('img')
      allImgs.forEach((img) => {
        const src = img.src || img.dataset.src || img.dataset.lazy || ''
        if (
          src &&
          !src.includes('fill.gif') &&
          !src.includes('fill_imagem') &&
          !src.includes('logo') &&
          !src.includes('icon') &&
          !src.includes('svg') &&
          !src.includes('ajax-loader') &&
          !src.includes('pme.') &&
          !src.includes('carrinho') &&
          !src.includes('appstore') &&
          !src.includes('playstore') &&
          !src.includes('wechat') &&
          (src.includes('produto') || src.includes('product') || img.width > 100)
        ) {
          if (!imageUrls.includes(src)) imageUrls.push(src)
        }
      })

      // Also check background images
      document.querySelectorAll('[style*="background-image"]').forEach((el) => {
        const match = (el as HTMLElement).style.backgroundImage.match(/url\(["']?(.+?)["']?\)/)
        if (match?.[1] && !match[1].includes('fill.gif') && !imageUrls.includes(match[1])) {
          imageUrls.push(match[1])
        }
      })

      // Colors
      const colors: string[] = []
      document
        .querySelectorAll('[class*="color"], [class*="cor"], [data-cor], .swatch, [title*="Dourado"], [title*="Prateado"]')
        .forEach((el) => {
          const color =
            el.textContent?.trim() ||
            el.getAttribute('title') ||
            (el as HTMLElement).dataset.cor ||
            ''
          if (color && !colors.includes(color) && color.length < 30) {
            colors.push(color)
          }
        })

      // Price
      const priceEl = document.querySelector('.price, .preco, [class*="price"], [class*="preco"]')
      let price = 0
      if (priceEl) {
        const priceMatch = priceEl.textContent?.match(/[\d]+[.,][\d]+/)
        if (priceMatch) {
          price = parseFloat(priceMatch[0].replace(',', '.'))
        }
      }

      return { name, ref, description, imageUrls, colors, price }
    })

    await browser.close()

    if (!productData.name && !productData.ref) {
      return NextResponse.json(
        { error: 'Não foi possível extrair dados do produto. Verifica se o URL é de uma página de produto.' },
        { status: 400 },
      )
    }

    // Download images and upload to Payload Media
    const mediaIds: number[] = []
    const tmpDir = path.join(os.tmpdir(), `shebiju-import-${Date.now()}`)
    fs.mkdirSync(tmpDir, { recursive: true })

    for (let i = 0; i < productData.imageUrls.length; i++) {
      const imgUrl = productData.imageUrls[i]
      try {
        // Download to temp file
        const ext = path.extname(new URL(imgUrl).pathname).split('?')[0] || '.webp'
        const filename = `${productData.ref || 'img'}_${i + 1}${ext}`
        const tmpPath = path.join(tmpDir, filename)

        const response = await fetch(imgUrl)
        if (!response.ok) continue
        const buffer = Buffer.from(await response.arrayBuffer())
        fs.writeFileSync(tmpPath, buffer)

        // Upload to Payload Media
        const media = await payload.create({
          collection: 'media',
          data: {
            alt: `${productData.name} ${productData.ref} ${i + 1}`,
          },
          file: {
            data: buffer,
            name: filename,
            mimetype: ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'image/jpeg',
            size: buffer.length,
          },
        })
        mediaIds.push(media.id as number)
      } catch {
        // Skip failed images
      }
    }

    // Cleanup temp dir
    try {
      fs.rmSync(tmpDir, { recursive: true })
    } catch {
      // ignore
    }

    // Build product data
    const slug = (productData.ref || productData.name || 'produto')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const productPayload: any = {
      name: productData.name || productData.ref || 'Produto Importado',
      slug,
      images: mediaIds,
      price: productData.price || 0,
      availability: 'in_stock',
      enableColors: productData.colors.length > 0,
      enableSizes: false,
    }

    if (categoryId) {
      productPayload.category = categoryId
    }

    // Create the product
    const product = await payload.create({
      collection: 'products',
      data: productPayload,
    })

    return NextResponse.json({
      success: true,
      productId: product.id,
      data: {
        name: productData.name,
        ref: productData.ref,
        imagesUploaded: mediaIds.length,
        colors: productData.colors,
        price: productData.price,
      },
    })
  } catch (err: any) {
    console.error('Import error:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao importar produto' },
      { status: 500 },
    )
  }
}
