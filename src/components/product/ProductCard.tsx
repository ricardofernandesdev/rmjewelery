import Image from 'next/image'
import Link from 'next/link'
import type { Product, Media } from '../../../payload-types'
import { WishlistButton } from './WishlistButton'

type ProductCardProps = {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const coverImage =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : null
  const media =
    coverImage && typeof coverImage === 'object' ? (coverImage as Media) : null

  const price = (product as any).price
  const formattedPrice =
    typeof price === 'number'
      ? price.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
      : null

  const wishlistItem = {
    id: product.id,
    name: product.name,
    slug: product.slug || '',
    price: typeof price === 'number' ? price : undefined,
    imageUrl: media?.sizes?.card?.url || media?.url || null,
  }

  return (
    <Link href={`/products/${product.slug}`} className="group block relative">
      {/* Wishlist button */}
      <div className="absolute top-2 right-2 z-10">
        <WishlistButton
          item={wishlistItem}
          className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-brand-dark hover:bg-white hover:text-red-500 shadow-sm"
          size={16}
        />
      </div>

      {/* Product image */}
      <div className="relative aspect-square overflow-hidden bg-white border border-gray-100">
        {media ? (
          <Image
            src={media.sizes?.card?.url || media.url || ''}
            alt={media.alt || product.name}
            width={media.sizes?.card?.width || 800}
            height={media.sizes?.card?.height || 800}
            placeholder={media.blurDataURL ? 'blur' : 'empty'}
            blurDataURL={media.blurDataURL || undefined}
            className="object-contain w-full h-full p-4 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-white" />
        )}
      </div>

      {/* Brand badge */}
      <div className="flex items-center gap-2 mt-3 mb-1">
        <span className="text-[10px] font-bold tracking-wider text-brand-dark">RM</span>
      </div>

      {/* Product info */}
      <h3 className="text-sm text-brand-dark leading-snug mb-1">
        {product.name}
      </h3>
      {formattedPrice && (
        <p className="text-sm font-medium text-brand-dark">{formattedPrice}</p>
      )}
    </Link>
  )
}
