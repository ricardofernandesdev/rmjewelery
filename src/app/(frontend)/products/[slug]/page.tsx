import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getAllProducts, getProductBySlug, getProductsByCategory, getSiteSettings } from '@/lib/queries'
import type { Product } from '../../../../../payload-types'
import { Container } from '@/components/ui/Container'
import { InstagramCTA } from '@/components/product/InstagramCTA'
import { ShareWhatsApp } from '@/components/product/ShareWhatsApp'
import { ProductDetailClient } from '@/components/product/ProductDetailClient'
import { WishlistButton } from '@/components/product/WishlistButton'
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
    title: `${product.name} | R&M Jewelry`,
    description: `${product.name} - R&M Jewelry`,
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

  // Helper to serialize a product for the carousels
  const toSimpleProduct = (p: Product) => {
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
  }

  // Fetch similar products (same category, excluding current).
  // Fallback: if the category has no siblings, pick recent products from the catalog.
  const categorySlug = category?.slug
  let similarProducts: ReturnType<typeof toSimpleProduct>[] = []
  if (categorySlug) {
    const { docs } = await getProductsByCategory(categorySlug, 20)
    similarProducts = docs
      .filter((p) => p.id !== product.id)
      .slice(0, 12)
      .map(toSimpleProduct)
  }
  if (similarProducts.length === 0) {
    const { docs } = await getAllProducts(20)
    similarProducts = docs
      .filter((p) => p.id !== product.id)
      .slice(0, 12)
      .map(toSimpleProduct)
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

  // Passo 2 — Cores (lidas da relação global) + tamanhos (ainda inline)
  // product.colors vem populado a depth 2, por isso cada item é um doc
  // completo { id, name, hex, slug }. Se vier como id (depth 0) ignoramos.
  const rawColors = ((product as any).colors || []) as any[]
  const colorById = new Map<string, { name: string; hex: string }>()
  const colorTerms = rawColors
    .filter((c) => c && typeof c === 'object')
    .map((c) => {
      const entry = { name: c.name || '', hex: c.hex || '#ccc' }
      colorById.set(String(c.id), entry)
      return entry
    })

  // Tamanhos vêm da relação global (depth 2). Se a depth não os populou,
  // ignoramos os ids puros — o select já não renderiza nada útil.
  const rawSizes = ((product as any).sizes || []) as any[]
  const sizeById = new Map<string, { value: string }>()
  const sizeTerms = rawSizes
    .filter((s) => s && typeof s === 'object')
    .map((s) => {
      const entry = { value: s.name || '' }
      sizeById.set(String(s.id), entry)
      return entry
    })

  // Passo 3 — Variantes
  // variant.color agora guarda o ID da cor (string numérico) em vez do nome,
  // mas o componente VariantSelector continua a comparar pelo nome. Resolvemos
  // o ID para o nome correspondente aqui antes de passar aos componentes.
  const variants = ((product as any).variants || []).map((v: any) => {
    const resolvedColor = colorById.get(String(v.color))
    // variant.sizes is now hasMany — populated to size docs at depth 2.
    // Each entry is either a doc { id, name } or a raw id when depth was 0.
    const variantSizeNames: string[] = []
    if (Array.isArray(v.sizes)) {
      for (const s of v.sizes) {
        if (s && typeof s === 'object' && s.name) variantSizeNames.push(s.name)
        else {
          const resolved = sizeById.get(String(s))
          if (resolved?.value) variantSizeNames.push(resolved.value)
        }
      }
    }
    return {
      color: resolvedColor?.name || '',
      sizes: variantSizeNames,
      price: v.price ?? null,
      availability: v.availability || 'in_stock',
      images: Array.isArray(v.images)
        ? v.images.filter((img: any) => typeof img === 'object' && img !== null)
        : [],
    }
  })

  const price = (product as any).price || 0
  const availabilityLabel =
    (product as any).availability === 'out_of_stock' ? 'Esgotado' : 'Em stock'

  return (
    <>
      <Container className="py-8">
        <ProductDetailClient
          mainImages={images}
          colorTerms={colorTerms}
          sizeTerms={sizeTerms}
          variants={variants}
          basePrice={price}
          afterVariants={
            product.description ? (
              <div className="pt-4">
                <div className="prose prose-sm prose-p:text-brand-gray prose-headings:text-brand-dark max-w-none">
                  <RichText data={product.description} />
                </div>
              </div>
            ) : null
          }
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
            {price > 0 && colorTerms.length === 0 && sizeTerms.length === 0 && variants.length === 0 && (
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

          {/* CTA Button + Wishlist */}
          <div className="mt-2 flex gap-2">
            {(() => {
              const message = `Olá! Tenho interesse no produto "${product.name}". Podem dar-me mais informações?`
              const separator = instagramUrl.includes('?') ? '&' : '?'
              const fullUrl = `${instagramUrl}${separator}text=${encodeURIComponent(message)}`
              return (
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-3 bg-brand-dark text-white py-4 text-sm tracking-wider uppercase hover:bg-brand-dark/90 transition-colors"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                  ENVIAR MENSAGEM NO INSTAGRAM
                </a>
              )
            })()}
            <WishlistButton
              item={{
                id: product.id,
                name: product.name,
                slug: product.slug || '',
                price: (product as any).price,
                imageUrl: firstImg?.sizes?.card?.url || firstImg?.url || null,
              }}
              className="flex items-center justify-center w-14 border border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-white transition-colors"
              size={20}
            />
          </div>

          {/* Share on WhatsApp */}
          <div className="mt-2">
            <ShareWhatsApp productName={product.name} productSlug={product.slug || ''} />
          </div>
        </ProductDetailClient>

        {/* Divider before related products */}
        <div className="mt-10 border-t border-gray-100" />

        {/* Similar Products + Recently Viewed */}
        <ProductPageExtras
          currentProduct={currentProductData}
          similarProducts={similarProducts}
        />
      </Container>
    </>
  )
}
