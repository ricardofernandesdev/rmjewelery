import { getPayload } from '@/lib/payload'

export async function getSiteSettings() {
  const payload = await getPayload()
  return payload.findGlobal({ slug: 'site-settings', depth: 2 })
}

export async function getFooterSettings() {
  const payload = await getPayload()
  return payload.findGlobal({ slug: 'footer-settings', depth: 0 })
}

export async function getHomeSettings() {
  const payload = await getPayload()
  return payload.findGlobal({ slug: 'home-settings', depth: 2 })
}

export async function getAllProducts(limit = 50) {
  const payload = await getPayload()
  return payload.find({
    collection: 'products',
    limit,
    sort: 'sortOrder',
    depth: 1,
  })
}

export async function getProductsPaginated({
  page = 1,
  limit = 24,
  categorySlug,
}: {
  page?: number
  limit?: number
  categorySlug?: string
} = {}) {
  const payload = await getPayload()

  let categoryId: number | string | null = null
  if (categorySlug) {
    const category = await getCategoryBySlug(categorySlug)
    if (!category) {
      return {
        docs: [],
        totalDocs: 0,
        totalPages: 0,
        page: 1,
        limit,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
      }
    }
    categoryId = category.id
  }

  return payload.find({
    collection: 'products',
    where: categoryId ? { category: { equals: categoryId } } : undefined,
    limit,
    page,
    sort: 'sortOrder',
    depth: 1,
  })
}

export async function getProductBySlug(slug: string) {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  return docs[0] || null
}

export async function getProductsByCategory(categorySlug: string, limit = 50) {
  const payload = await getPayload()
  const category = await getCategoryBySlug(categorySlug)
  if (!category) return { docs: [], totalDocs: 0, totalPages: 0, page: 1, pagingCounter: 1, hasPrevPage: false, hasNextPage: false, prevPage: null, nextPage: null, limit }
  return payload.find({
    collection: 'products',
    where: { category: { equals: category.id } },
    limit,
    sort: 'sortOrder',
    depth: 1,
  })
}

export async function searchProducts(term: string, limit = 50) {
  const payload = await getPayload()
  const trimmed = term.trim()
  if (!trimmed) {
    return { docs: [], totalDocs: 0 }
  }
  return payload.find({
    collection: 'products',
    where: {
      name: { like: trimmed },
    },
    limit,
    depth: 1,
  })
}

export async function getPageBySlug(slug: string) {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'pages',
    where: {
      slug: { equals: slug },
      published: { equals: true },
    },
    limit: 1,
    depth: 0,
  })
  return docs[0] || null
}

export async function getAllPages() {
  const payload = await getPayload()
  return payload.find({
    collection: 'pages',
    where: { published: { equals: true } },
    sort: 'title',
    depth: 0,
  })
}

export async function getAllCategories() {
  const payload = await getPayload()
  return payload.find({
    collection: 'categories',
    sort: 'sortOrder',
    depth: 1,
  })
}

export async function getCategoryBySlug(slug: string) {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return docs[0] || null
}
