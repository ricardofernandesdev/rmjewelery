import { describe, it, expect, beforeAll } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload, testId } from '../helpers/payload'
import sharp from 'sharp'

describe('Catalog page queries (CAT-01)', () => {
  let payload: Payload
  const uid = testId()
  let categoryId: number

  beforeAll(async () => {
    payload = await getTestPayload()

    // Create a test category
    const category = await payload.create({
      collection: 'categories',
      data: { name: `Catalog Cat ${uid}` },
    })
    categoryId = category.id

    // Create test image
    const imgBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 200, g: 180, b: 160 },
      },
    })
      .png()
      .toBuffer()

    const media = await payload.create({
      collection: 'media',
      data: { alt: `catalog-test-${uid}` },
      file: {
        data: imgBuffer,
        mimetype: 'image/png',
        name: `catalog-${uid}.png`,
        size: imgBuffer.length,
      },
    })

    // Create 2 test products
    for (let i = 0; i < 2; i++) {
      await payload.create({
        collection: 'products',
        data: {
          name: `Catalog Product ${i} ${uid}`,
          images: [media.id],
          category: categoryId,
        },
      })
    }
  })

  it('getAllProducts returns products with expected shape', async () => {
    const { getAllProducts } = await import('../../src/lib/queries')
    const result = await getAllProducts()

    expect(result.docs).toBeDefined()
    expect(Array.isArray(result.docs)).toBe(true)
    expect(result.docs.length).toBeGreaterThanOrEqual(2)

    // Find our test products
    const testProducts = result.docs.filter((p: any) =>
      p.name?.includes(uid),
    )
    expect(testProducts.length).toBe(2)
  })

  it('products have populated images (object, not string ID)', async () => {
    const { getAllProducts } = await import('../../src/lib/queries')
    const result = await getAllProducts()

    const testProduct = result.docs.find((p: any) => p.name?.includes(uid))
    expect(testProduct).toBeDefined()
    expect(testProduct!.images).toBeDefined()
    expect(Array.isArray(testProduct!.images)).toBe(true)
    expect(testProduct!.images.length).toBeGreaterThan(0)

    // depth: 1 means images should be populated objects, not bare IDs
    const firstImage = testProduct!.images[0]
    expect(typeof firstImage).toBe('object')
    expect(firstImage).toHaveProperty('url')
  })

  it('products have populated category (object, not string ID)', async () => {
    const { getAllProducts } = await import('../../src/lib/queries')
    const result = await getAllProducts()

    const testProduct = result.docs.find((p: any) => p.name?.includes(uid))
    expect(testProduct).toBeDefined()
    expect(typeof testProduct!.category).toBe('object')
    expect(testProduct!.category).toHaveProperty('name')
  })
})
