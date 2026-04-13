import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'
import fs from 'fs'
import puppeteerCore from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

// Vercel free = 10s, Pro = 60s. Keep this tight.
export const maxDuration = 10

async function getBrowser() {
  if (process.env.NODE_ENV === 'development') {
    const possiblePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ]
    const executablePath = possiblePaths.find((p) => {
      try { return fs.existsSync(p) } catch { return false }
    })
    return puppeteerCore.launch({
      headless: true,
      executablePath: executablePath || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    })
  }

  // Serverless — lean Chromium flags for speed
  chromium.setGraphicsMode = false
  return puppeteerCore.launch({
    args: [...chromium.args, '--disable-gpu', '--disable-dev-shm-usage', '--single-process'],
    executablePath: await chromium.executablePath(),
    headless: true,
  })
}

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

    const browser = await getBrowser()
    const page = await browser.newPage()

    // Block images/css/fonts to speed up page load — we only need the DOM
    await page.setRequestInterception(true)
    page.on('request', (r: any) => {
      const type = r.resourceType()
      if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
        r.abort()
      } else {
        r.continue()
      }
    })

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    )
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 })

    // Short wait for JS to hydrate
    await new Promise((r) => setTimeout(r, 2000))

    const productData = await page.evaluate(() => {
      const nameEl = document.querySelector(
        'h1, h2, .product-name, .product-title, [class*="product"][class*="name"]',
      )
      let name = nameEl?.textContent?.trim() || ''

      const refMatch = name.match(/([A-Z]{2,}[\d]+[\w.]*)/i)
      const ref = refMatch ? refMatch[1] : ''

      if (ref && name.includes(ref)) {
        name = name.replace(ref, '').trim()
      }
      name = name.replace(/^[\s\-–.]+|[\s\-–.]+$/g, '').trim()

      const descEl = document.querySelector(
        '.product-description, .description, [class*="descri"], [class*="detail"] p',
      )
      const description = descEl?.textContent?.trim() || ''

      // Collect image URLs from img[src], img[data-src], background-image
      const imageUrls: string[] = []
      document.querySelectorAll('img').forEach((img) => {
        const src = img.src || img.dataset.src || img.dataset.lazy || img.getAttribute('data-original') || ''
        if (
          src &&
          !src.includes('fill.gif') && !src.includes('fill_imagem') &&
          !src.includes('logo') && !src.includes('icon') && !src.includes('svg') &&
          !src.includes('ajax-loader') && !src.includes('pme.') &&
          !src.includes('carrinho') && !src.includes('appstore') &&
          !src.includes('playstore') && !src.includes('wechat')
        ) {
          if (!imageUrls.includes(src)) imageUrls.push(src)
        }
      })

      document.querySelectorAll('[style*="background-image"]').forEach((el) => {
        const match = (el as HTMLElement).style.backgroundImage.match(/url\(["']?(.+?)["']?\)/)
        if (match?.[1] && !match[1].includes('fill.gif') && !imageUrls.includes(match[1])) {
          imageUrls.push(match[1])
        }
      })

      const colors: string[] = []
      document
        .querySelectorAll('[class*="color"], [class*="cor"], [data-cor], .swatch, [title*="Dourado"], [title*="Prateado"]')
        .forEach((el) => {
          const color =
            el.textContent?.trim() || el.getAttribute('title') || (el as HTMLElement).dataset.cor || ''
          if (color && !colors.includes(color) && color.length < 30) colors.push(color)
        })

      const priceEl = document.querySelector('.price, .preco, [class*="price"], [class*="preco"]')
      let price = 0
      if (priceEl) {
        const priceMatch = priceEl.textContent?.match(/[\d]+[.,][\d]+/)
        if (priceMatch) price = parseFloat(priceMatch[0].replace(',', '.'))
      }

      return { name, ref, description, imageUrls, colors, price }
    })

    await browser.close()

    return NextResponse.json({ success: true, ...productData })
  } catch (err: any) {
    console.error('Scrape error:', err)
    return NextResponse.json({ error: err.message || 'Erro ao extrair dados' }, { status: 500 })
  }
}
