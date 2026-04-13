import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'
import path from 'path'

export const maxDuration = 10

/**
 * Download ONE image from a URL, upload it to Payload Media,
 * and append it to the product's images array.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload()
    const hdrs = await headers()
    const { user } = await payload.auth({ headers: hdrs })
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { imageUrl, productId, productName, index } = await req.json()
    if (!imageUrl || !productId) {
      return NextResponse.json({ error: 'imageUrl e productId são obrigatórios' }, { status: 400 })
    }

    // Download image
    const response = await fetch(imageUrl, { signal: AbortSignal.timeout(6000) })
    if (!response.ok) {
      return NextResponse.json({ error: `Imagem devolveu status ${response.status}` }, { status: 502 })
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const ext = path.extname(new URL(imageUrl).pathname).split('?')[0] || '.webp'
    const filename = `${productName || 'img'}_${index || 1}${ext}`

    // Upload to Payload Media
    const media = await payload.create({
      collection: 'media',
      data: { alt: `${productName || 'Produto'} ${index || 1}` },
      file: {
        data: buffer,
        name: filename.replace(/[^a-zA-Z0-9_.-]/g, '_'),
        mimetype: ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'image/jpeg',
        size: buffer.length,
      },
    })

    // Append to product's images array
    const product = await payload.findByID({ collection: 'products', id: productId, depth: 0 })
    const currentImages = (product.images as number[]) || []
    await payload.update({
      collection: 'products',
      id: productId,
      data: { images: [...currentImages, media.id] },
    })

    return NextResponse.json({ success: true, mediaId: media.id })
  } catch (err: any) {
    console.error('Upload image error:', err)
    return NextResponse.json({ error: err.message || 'Erro ao carregar imagem' }, { status: 500 })
  }
}
