import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getAllProducts, getProductBySlug, getProductsByCategory, getSiteSettings } from '@/lib/queries'
import { Container } from '@/components/ui/Container'
import { InstagramCTA } from '@/components/product/InstagramCTA'
import { ProductDetailClient } from '@/components/product/ProductDetailClient'
import { ProductPageExtras } from '@/components/product/ProductPageExtras'
import type { Media, Category } from '../../../../../payload-types'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const { docs } = await getAllProducts(1000)
    return docs.map((product) => ({ slug: product.slug || '' }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return {}

  const firstImage =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : null
  const ogImage =
    firstImage && typeof firstImage === 'object'
      ? (firstImage as Media).sizes?.detail?.url || (firstImage as Media).url
      : undefined

  return {
    title: `${product.name} | RM Jewelry`,
    description: `${product.name} - RM Jewelry`,
    openGraph: ogImage ? { images: [{ url: ogImage }] } : undefined,
  }
  } catch {
    return {}
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const [product, siteSettings] = await Promise.all([
    getProductBySlug(slug),
    getSiteSettings().catch(() => null),
  ])

  if (!product) notFound()

  const instagramUrl = (siteSettings as any)?.instagramUrl || 'https://ig.me/m/rmjewelry.collection'

  // Extract populated images (filter out non-object entries)
  const images = Array.isArray(product.images)
    ? (product.images.filter(
        (img): img is Media => typeof img === 'object' && img !== null,
      ) as Media[])
    : []

  const category =
    typeof product.category === 'object'
      ? (product.category as Category)
      : null

  // Fetch similar products (same category, excluding current)
  const categorySlug = category?.slug
  let similarProducts: any[] = []
  if (categorySlug) {
    const { docs } = await getProductsByCategory(categorySlug, 20)
    similarProducts = docs
      .filter((p) => p.id !== product.id)
      .slice(0, 12)
      .map((p) => {
        const img = Array.isArray(p.images) && p.images[0] && typeof p.images[0] === 'object'
          ? (p.images[0] as Media)
          : null
        return {
          id: p.id,
          name: p.name,
          slug: p.slug || '',
          price: (p as any).price,
          imageUrl: img?.sizes?.card?.url || img?.url || null,
          imageAlt: img?.alt || p.name,
        }
      })
  }

  // Current product serialized for client tracking
  const firstImg = images[0] || null
  const currentProductData = {
    id: product.id,
    name: product.name,
    slug: product.slug || '',
    price: (product as any).price,
    imageUrl: firstImg?.sizes?.card?.url || firstImg?.url || null,
    imageAlt: firstImg?.alt || product.name,
  }

  // Extract variants
  const variants = ((product as any).variants || []).map((v: any) => ({
    name: v.name,
    price: v.price ?? null,
    availability: v.availability || 'in_stock',
    images: Array.isArray(v.images)
      ? v.images.filter((img: any) => typeof img === 'object' && img !== null)
      : [],
  }))

  return (
    <Container className="py-8">
      <ProductDetailClient
        mainImages={images}
        variants={variants}
        basePrice={(product as any).price || 0}
      >
        {/* Static content passed as children */}
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-semibold text-brand-dark">
            {product.name}
          </h1>
          {category && (
            <Link
              href={`/categories/${category.slug}`}
              className="text-sm text-brand-gray hover:text-brand-dark transition-colors"
            >
              {category.name}
            </Link>
          )}
        </div>

        {product.description && (
          <div className="prose prose-sm text-brand-gray max-w-none">
            <RichText data={product.description} />
          </div>
        )}

        <div className="mt-4">
          <InstagramCTA instagramUrl={instagramUrl} />
        </div>
      </ProductDetailClient>

      {/* Similar + Recently Viewed */}
      <ProductPageExtras
        currentProduct={currentProductData}
        similarProducts={similarProducts}
      />
    </Container>
  )
}
