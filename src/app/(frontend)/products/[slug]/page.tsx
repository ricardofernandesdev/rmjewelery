import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getAllProducts, getProductBySlug } from '@/lib/queries'
import { Container } from '@/components/ui/Container'
import { ProductGallery } from '@/components/product/ProductGallery'
import { InstagramCTA } from '@/components/product/InstagramCTA'
import type { Media, Category } from '../../../../../payload-types'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const { docs } = await getAllProducts(1000)
  return docs.map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
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
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) notFound()

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

  return (
    <Container className="py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery (left on desktop) */}
        <ProductGallery images={images} />

        {/* Product info (right on desktop) */}
        <div className="flex flex-col gap-4">
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
            <InstagramCTA />
          </div>
        </div>
      </div>
    </Container>
  )
}
