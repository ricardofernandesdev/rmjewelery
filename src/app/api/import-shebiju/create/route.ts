import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'
import path from 'path'

// Image download + upload + product creation — no browser needed, should be fast
export const maxDuration = 10

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload()
    const hdrs = await headers()
    const { user } = await payload.auth({ headers: hdrs })
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { name, ref, description, imageUrls, colors, price, categoryId } = await req.json()

    if (!name && !ref) {
      return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 })
    }

    // Download images and upload to Payload Media
    const mediaIds: number[] = []

    for (let i = 0; i < (imageUrls || []).length; i++) {
      const imgUrl = imageUrls[i]
      try {
        const response = await fetch(imgUrl, { signal: AbortSignal.timeout(5000) })
        if (!response.ok) continue

        const buffer = Buffer.from(await response.arrayBuffer())
        const ext = path.extname(new URL(imgUrl).pathname).split('?')[0] || '.webp'
        const filename = `${ref || 'img'}_${i + 1}${ext}`

        const media = await payload.create({
          collection: 'media',
          data: {
            alt: `${name || ref} ${i + 1}`,
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
        // Skip failed images — don't block the whole import
      }
    }

    // Build slug from ref or name
    const slug = (ref || name || 'produto')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const productData: any = {
      name: name || ref || 'Produto Importado',
      slug,
      images: mediaIds,
      price: price || 0,
      availability: 'in_stock',
      enableColors: (colors || []).length > 0,
      enableSizes: false,
    }

    if (categoryId) {
      productData.category = categoryId
    }

    const product = await payload.create({
      collection: 'products',
      data: productData,
    })

    return NextResponse.json({
      success: true,
      productId: product.id,
      imagesUploaded: mediaIds.length,
    })
  } catch (err: any) {
    console.error('Create error:', err)
    return NextResponse.json({ error: err.message || 'Erro ao criar produto' }, { status: 500 })
  }
}
