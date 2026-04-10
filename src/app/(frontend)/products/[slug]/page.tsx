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

  // Extract colors, sizes, variants
  const colors = ((product as any).colors || []).map((c: any) => ({
    name: c.name || '',
    hex: c.hex || '#ccc',
    images: Array.isArray(c.images)
      ? c.images.filter((img: any) => typeof img === 'object' && img !== null)
      : [],
  }))
  const sizes = ((product as any).sizes || []).map((s: any) => ({
    value: s.value || '',
  }))
  const variants = ((product as any).variants || []).map((v: any) => ({
    color: v.color || '',
    size: v.size || '',
    price: v.price ?? null,
    availability: v.availability || 'in_stock',
  }))

  const price = (product as any).price || 0
  const availabilityLabel =
    (product as any).availability === 'out_of_stock' ? 'Esgotado' : 'Em stock'

  return (
    <>
      <Container className="py-8">
        <ProductDetailClient
          mainImages={images}
          colors={colors}
          sizes={sizes}
          variants={variants}
          basePrice={price}
        >
          {/* Category */}
          {category && (
            <Link
              href={`/categories/${category.slug}`}
              className="text-[10px] tracking-[0.25em] uppercase text-brand-gray hover:text-brand-dark transition-colors"
            >
              {category.name}
            </Link>
          )}

          {/* Title + Price */}
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-semibold text-brand-dark">
              {product.name}
            </h1>
            {price > 0 && variants.length === 0 && (
              <p className="text-lg text-brand-gray mt-1">
                {price.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
              </p>
            )}
          </div>

          {/* Availability */}
          <div className="text-xs text-brand-gray uppercase tracking-wider">
            DISPONIBILIDADE:{' '}
            <span className={`font-medium ${(product as any).availability === 'out_of_stock' ? 'text-red-500' : 'text-green-600'}`}>
              {availabilityLabel}
            </span>
          </div>

          {/* CTA Button */}
          <div className="mt-2">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-brand-dark text-white py-4 text-sm tracking-wider uppercase hover:bg-brand-dark/90 transition-colors"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              TENHO INTERESSE
            </a>
          </div>

          {/* Description — inside product info */}
          {product.description && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="prose prose-sm prose-p:text-brand-gray prose-headings:text-brand-dark max-w-none">
                <RichText data={product.description} />
              </div>
            </div>
          )}
        </ProductDetailClient>

        {/* All product images grid */}
        {images.length > 1 && (
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative aspect-square bg-brand-cream overflow-hidden">
                <img
                  src={img.sizes?.card?.url || img.url || ''}
                  alt={img.alt || product.name}
                  className="w-full h-full object-contain p-4"
                />
              </div>
            ))}
          </div>
        )}

        {/* Similar Products */}
        <ProductPageExtras
          currentProduct={currentProductData}
          similarProducts={similarProducts}
        />
      </Container>
    </>
  )
}
