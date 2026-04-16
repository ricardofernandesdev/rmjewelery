import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import {
  getCategoryBySlug,
  getProductsPaginated,
  getCategoryPriceBounds,
  getAllCategories,
} from '@/lib/queries'
import { Container } from '@/components/ui/Container'
import { CategoryPageClient } from '@/components/product/CategoryPageClient'
import { JsonLd } from '@/components/seo/JsonLd'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rmjewelrycollection.com').replace(/\/$/, '')

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const { docs } = await getAllCategories()
    return docs.map((cat) => ({ slug: cat.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const category = await getCategoryBySlug(slug)
    if (!category) return {}

    const description =
      category.description ||
      `${category.name} — coleção de joalharia em aço inoxidável da R&M Jewelry.`
    const url = `${SITE_URL}/categories/${slug}`
    const img =
      category.image && typeof category.image === 'object'
        ? ((category.image as { url?: string }).url ?? null)
        : null

    return {
      title: category.name,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: 'website',
        title: category.name,
        description,
        url,
        ...(img ? { images: [{ url: img, alt: category.name }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title: category.name,
        description,
        ...(img ? { images: [img] } : {}),
      },
    }
  } catch {
    return {}
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params

  const [category, productsResult, priceBounds] = await Promise.all([
    getCategoryBySlug(slug).catch(() => null),
    getProductsPaginated({ page: 1, limit: PAGE_SIZE, categorySlug: slug }).catch(
      () => ({ docs: [] as never[], totalDocs: 0, totalPages: 0, page: 1, hasNextPage: false }),
    ),
    getCategoryPriceBounds(slug).catch(() => ({ min: 0, max: 0 })),
  ])

  if (!category) notFound()

  const products = productsResult.docs
  const totalDocs = productsResult.totalDocs || 0
  const hasMore = Boolean((productsResult as { hasNextPage?: boolean }).hasNextPage)

  const catImage =
    category.image && typeof category.image === 'object' ? (category.image as never) : null
  const catImageUrl = (catImage as { url?: string } | null)?.url || null
  const posX = (category as { bannerPositionX?: string }).bannerPositionX || 'center'
  const posY = (category as { bannerPositionY?: string }).bannerPositionY || 'center'

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: category.name,
        item: `${SITE_URL}/categories/${slug}`,
      },
    ],
  }

  return (
    <>
      <JsonLd data={breadcrumbLd} />
      {/* ── Hero banner ── */}
      <section className="relative w-full h-[300px] md:h-[400px] bg-brand-dark overflow-hidden -mt-[140px] pt-[140px]">
        {catImageUrl && (
          <Image
            src={catImageUrl}
            alt={(catImage as { alt?: string } | null)?.alt || category.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: `${posX} ${posY}` }}
          />
        )}
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <h1 className="font-heading text-white text-4xl md:text-6xl lg:text-7xl font-bold uppercase tracking-wider mb-4">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-white/80 text-sm md:text-base italic max-w-2xl leading-relaxed">
              {category.description}
            </p>
          )}
        </div>
      </section>

      {/* ── Filters + Products ── */}
      <Container className="py-6">
        <CategoryPageClient
          initialProducts={products}
          initialTotalDocs={totalDocs}
          initialHasMore={hasMore}
          categoryName={category.name}
          categorySlug={slug}
          pageSize={PAGE_SIZE}
          priceMin={priceBounds.min}
          priceMax={priceBounds.max}
        />
      </Container>
    </>
  )
}
