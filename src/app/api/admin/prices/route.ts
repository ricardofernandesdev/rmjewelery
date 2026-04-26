import { NextResponse } from 'next/server'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from '@/lib/payload'

async function requireAdmin() {
  const payload = await getPayload()
  const hdrs = await nextHeaders()
  const { user } = await payload.auth({ headers: hdrs })
  if (!user) return { payload, user: null as null }
  return { payload, user }
}

export async function GET(req: Request) {
  const { payload, user } = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '30', 10) || 30))
  const categoryId = url.searchParams.get('category') || ''
  const search = (url.searchParams.get('search') || '').trim()

  const priceFilter = url.searchParams.get('priceFilter') || 'all'

  const where: Record<string, unknown> = {}
  if (categoryId) where.category = { equals: Number(categoryId) || categoryId }
  if (search) {
    where.or = [{ name: { like: search } }, { slug: { like: search } }]
  }
  if (priceFilter === 'zero') where.price = { equals: 0 }
  else if (priceFilter === 'nonzero') where.price = { greater_than: 0 }

  const result = await payload.find({
    collection: 'products',
    where: Object.keys(where).length ? (where as never) : undefined,
    page,
    limit,
    sort: 'name',
    depth: 1,
  })

  const docs = result.docs.map((p) => {
    const product = p as {
      id: number | string
      name: string
      slug: string
      price?: number
      category?: { id: number | string; name: string } | number | string
      images?: Array<
        | {
            url?: string
            sizes?: { thumbnail?: { url?: string }; card?: { url?: string } }
          }
        | number
        | string
      >
      variants?: Array<{
        id?: string
        color?: string
        sizes?: Array<{ id: number | string; name: string } | number | string>
        price?: number | null
      }>
    }
    const cat = product.category
    const categoryName =
      cat && typeof cat === 'object' && 'name' in cat ? cat.name : null

    const firstImage = product.images?.[0]
    const imageUrl =
      firstImage && typeof firstImage === 'object'
        ? firstImage.sizes?.thumbnail?.url ||
          firstImage.sizes?.card?.url ||
          firstImage.url ||
          null
        : null

    const variants = (product.variants ?? []).map((v) => ({
      id: v.id,
      color: v.color || null,
      sizeLabels: (v.sizes ?? [])
        .map((s) => (typeof s === 'object' && s && 'name' in s ? s.name : null))
        .filter(Boolean) as string[],
      price: typeof v.price === 'number' ? v.price : null,
    }))

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: typeof product.price === 'number' ? product.price : 0,
      categoryName,
      imageUrl,
      variants,
    }
  })

  return NextResponse.json({
    docs,
    page: result.page,
    totalPages: result.totalPages,
    totalDocs: result.totalDocs,
    hasNextPage: result.hasNextPage,
  })
}

type PatchBody = {
  id: number | string
  price?: number
  variants?: Array<{ id: string; price: number | null }>
}

export async function PATCH(req: Request) {
  const { payload, user } = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: PatchBody
  try {
    body = (await req.json()) as PatchBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body?.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Pull current variants so we can merge price updates without touching other fields
  const current = (await payload.findByID({
    collection: 'products',
    id: body.id,
    depth: 0,
  })) as {
    variants?: Array<{ id?: string; price?: number | null; [k: string]: unknown }>
  }

  const data: Record<string, unknown> = {}
  if (typeof body.price === 'number' && Number.isFinite(body.price)) {
    data.price = body.price
  }

  if (Array.isArray(body.variants) && body.variants.length > 0 && current.variants) {
    const priceById = new Map(body.variants.map((v) => [v.id, v.price]))
    data.variants = current.variants.map((v) => {
      if (v.id && priceById.has(v.id)) {
        const next = priceById.get(v.id)
        return { ...v, price: typeof next === 'number' && Number.isFinite(next) ? next : null }
      }
      return v
    })
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  try {
    await payload.update({
      collection: 'products',
      id: body.id,
      data: data as never,
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Update failed' },
      { status: 500 },
    )
  }
}
