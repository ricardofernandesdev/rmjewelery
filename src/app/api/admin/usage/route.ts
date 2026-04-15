import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

export const maxDuration = 20

export async function GET() {
  const payload = await getPayload()
  const hdrs = await headers()
  const { user } = await payload.auth({ headers: hdrs })
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // R2 storage — sum sizes + object count across the bucket
  let r2Objects = 0
  let r2Bytes = 0
  let r2Error: string | null = null
  try {
    const s3 = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT!,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
    let token: string | undefined
    do {
      const r = await s3.send(
        new ListObjectsV2Command({
          Bucket: process.env.R2_BUCKET!,
          ContinuationToken: token,
        }),
      )
      for (const o of r.Contents || []) {
        r2Objects++
        r2Bytes += o.Size || 0
      }
      token = r.NextContinuationToken
    } while (token)
  } catch (e: any) {
    r2Error = e?.message || 'R2 indisponível'
  }

  // DB counts — use Payload local API (respects auth + hooks)
  const [products, media, categories, colors, sizes, users] = await Promise.all([
    payload.count({ collection: 'products' }),
    payload.count({ collection: 'media' }),
    payload.count({ collection: 'categories' }),
    payload.count({ collection: 'colors' }),
    payload.count({ collection: 'sizes' }),
    payload.count({ collection: 'users' }),
  ])

  // Products breakdown by category
  const allCats = await payload.find({
    collection: 'categories',
    limit: 100,
    depth: 0,
  })
  const breakdown = await Promise.all(
    allCats.docs.map(async (cat: any) => {
      const { totalDocs } = await payload.count({
        collection: 'products',
        where: { category: { equals: cat.id } },
      })
      return { category: cat.name, count: totalDocs }
    }),
  )

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    r2: {
      objects: r2Objects,
      bytes: r2Bytes,
      storageLimitBytes: 10 * 1024 * 1024 * 1024, // 10 GB free tier
      error: r2Error,
    },
    db: {
      products: products.totalDocs,
      media: media.totalDocs,
      categories: categories.totalDocs,
      colors: colors.totalDocs,
      sizes: sizes.totalDocs,
      users: users.totalDocs,
      productsByCategory: breakdown.sort((a, b) => b.count - a.count),
    },
    links: {
      vercelUsage: 'https://vercel.com/dashboard/usage',
      cloudflareAnalytics: 'https://dash.cloudflare.com/?to=/:account/r2/default/buckets/rmjewelry-media/metrics',
    },
  })
}
