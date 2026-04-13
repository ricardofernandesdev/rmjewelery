import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'
import path from 'path'

export const maxDuration = 10

/**
 * Download ONE image from a URL and upload it to Payload Media.
 * Returns the media ID — does NOT attach it to any product yet.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload()
    const hdrs = await headers()
    const { user } = await payload.auth({ headers: hdrs })
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { imageUrl, altText, index } = await req.json()
    if (!imageUrl) return NextResponse.json({ error: 'imageUrl obrigatório' }, { status: 400 })

    const response = await fetch(imageUrl, { signal: AbortSignal.timeout(6000) })
    if (!response.ok) {
      return NextResponse.json({ error: `Imagem devolveu status ${response.status}` }, { status: 502 })
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const ext = path.extname(new URL(imageUrl).pathname).split('?')[0] || '.webp'
    const filename = `${(altText || 'img').replace(/[^a-zA-Z0-9_.-]/g, '_')}_${index || 1}${ext}`

    const media = await payload.create({
      collection: 'media',
      data: { alt: `${altText || 'Produto'} ${index || 1}` },
      file: {
        data: buffer,
        name: filename,
        mimetype: ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'image/jpeg',
        size: buffer.length,
      },
    })

    return NextResponse.json({ success: true, mediaId: media.id })
  } catch (err: any) {
    console.error('Upload image error:', err)
    return NextResponse.json({ error: err.message || 'Erro ao carregar imagem' }, { status: 500 })
  }
}
