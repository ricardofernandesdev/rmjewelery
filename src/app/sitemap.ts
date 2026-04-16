import type { MetadataRoute } from 'next'
import { getPayload } from '@/lib/payload'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rmjewelrycollection.com').replace(/\/$/, '')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
  ]

  try {
    const payload = await getPayload()

    const [categories, products, pages] = await Promise.all([
      payload.find({ collection: 'categories', limit: 0, depth: 0 }),
      payload.find({ collection: 'products', limit: 0, depth: 0 }),
      payload.find({
        collection: 'pages',
        where: { published: { equals: true } },
        limit: 0,
        depth: 0,
      }),
    ])

    const categoryEntries: MetadataRoute.Sitemap = categories.docs.map((c) => ({
      url: `${SITE_URL}/categories/${(c as { slug: string }).slug}`,
      lastModified: new Date((c as { updatedAt?: string }).updatedAt || now),
      changeFrequency: 'daily',
      priority: 0.8,
    }))

    const productEntries: MetadataRoute.Sitemap = products.docs.map((p) => ({
      url: `${SITE_URL}/products/${(p as { slug: string }).slug}`,
      lastModified: new Date((p as { updatedAt?: string }).updatedAt || now),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    const pageEntries: MetadataRoute.Sitemap = pages.docs.map((p) => ({
      url: `${SITE_URL}/${(p as { slug: string }).slug}`,
      lastModified: new Date((p as { updatedAt?: string }).updatedAt || now),
      changeFrequency: 'monthly',
      priority: 0.5,
    }))

    return [...staticEntries, ...categoryEntries, ...productEntries, ...pageEntries]
  } catch {
    return staticEntries
  }
}
