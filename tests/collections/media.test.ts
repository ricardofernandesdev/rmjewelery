import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload, testId } from '../helpers/payload'
import sharp from 'sharp'

describe('Media collection (INF-01)', () => {
  let payload: Payload
  const createdIds: number[] = []
  const uid = testId()

  beforeAll(async () => {
    payload = await getTestPayload()
  })

  afterAll(async () => {
    for (const id of createdIds) {
      try {
        await payload.delete({ collection: 'media', id })
      } catch {
        // ignore
      }
    }
  })

  it('uploaded image generates thumbnail, card, detail, zoom sizes', async () => {
    const imgBuffer = await sharp({
      create: { width: 3000, height: 3000, channels: 3, background: { r: 128, g: 128, b: 128 } },
    })
      .png()
      .toBuffer()

    const media = await payload.create({
      collection: 'media',
      data: { alt: 'Size test image' },
      file: {
        data: imgBuffer,
        mimetype: 'image/png',
        name: `test-sizes-${uid}.png`,
        size: imgBuffer.length,
      },
    })

    createdIds.push(media.id)

    expect(media.sizes).toBeDefined()
    const sizes = media.sizes as Record<string, any>
    expect(sizes.thumbnail).toBeDefined()
    expect(sizes.thumbnail.filename).toBeTruthy()
    expect(sizes.card).toBeDefined()
    expect(sizes.card.filename).toBeTruthy()
    expect(sizes.detail).toBeDefined()
    expect(sizes.detail.filename).toBeTruthy()
    expect(sizes.zoom).toBeDefined()
    expect(sizes.zoom.filename).toBeTruthy()
  })

  it('blurDataURL is generated after upload', async () => {
    const imgBuffer = await sharp({
      create: { width: 200, height: 200, channels: 3, background: { r: 200, g: 100, b: 50 } },
    })
      .png()
      .toBuffer()

    const media = await payload.create({
      collection: 'media',
      data: { alt: 'Blur test image' },
      file: {
        data: imgBuffer,
        mimetype: 'image/png',
        name: `test-blur-${uid}.png`,
        size: imgBuffer.length,
      },
    })

    createdIds.push(media.id)

    // blurDataURL is set via afterChange hook which triggers an update
    // Re-fetch to get the updated document
    const refetched = await payload.findByID({
      collection: 'media',
      id: media.id,
    })

    expect(refetched.blurDataURL).toBeDefined()
    expect(typeof refetched.blurDataURL).toBe('string')
    expect((refetched.blurDataURL as string).startsWith('data:image')).toBe(true)
  })
})
