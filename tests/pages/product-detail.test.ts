import { describe, it, expect, beforeAll } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload, testId } from '../helpers/payload'
import sharp from 'sharp'

describe('Product detail page queries (CAT-02)', () => {
  let payload: Payload
  const uid = testId()
  let productSlug: string

  beforeAll(async () => {
    payload = await getTestPayload()

    const category = await payload.create({
      collection: 'categories',
      data: { name: `Detail Cat ${uid}` },
    })

    const imgBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 150, g: 130, b: 110 },
      },
    })
      .png()
      .toBuffer()

    const media = await payload.create({
      collection: 'media',
      data: { alt: `detail-test-${uid}` },
      file: {
        data: imgBuffer,
        mimetype: 'image/png',
        name: `detail-${uid}.png`,
        size: imgBuffer.length,
      },
    })

    const product = await payload.create({
      collection: 'products',
      data: {
        name: `Detail Product ${uid}`,
        description: { root: { type: 'root', version: 1, direction: null, format: '' as const, indent: 0, children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: 'A beautiful test piece' }] }] } },
        images: [media.id],
        category: category.id,
      },
    })

    productSlug = product.slug!
  })

  it('getProductBySlug returns product with full data (CAT-02)', async () => {
    const { getProductBySlug } = await import('../../src/lib/queries')
    const product = await getProductBySlug(productSlug)

    expect(product).not.toBeNull()
    expect(product!.name).toContain(uid)
    expect(product!.slug).toBe(productSlug)
  })

  it('product has images array with populated objects', async () => {
    const { getProductBySlug } = await import('../../src/lib/queries')
    const product = await getProductBySlug(productSlug)

    expect(product!.images).toBeDefined()
    expect(Array.isArray(product!.images)).toBe(true)
    expect(product!.images.length).toBeGreaterThan(0)
    expect(typeof product!.images[0]).toBe('object')
  })

  it('product has populated category object at depth 2', async () => {
    const { getProductBySlug } = await import('../../src/lib/queries')
    const product = await getProductBySlug(productSlug)

    expect(typeof product!.category).toBe('object')
    expect(product!.category).toHaveProperty('name')
    expect(product!.category).toHaveProperty('slug')
  })

  it('returns null for nonexistent slug', async () => {
    const { getProductBySlug } = await import('../../src/lib/queries')
    const product = await getProductBySlug('nonexistent-slug-xyz-99999')

    expect(product).toBeNull()
  })
})
