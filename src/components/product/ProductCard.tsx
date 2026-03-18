import Image from 'next/image'
import Link from 'next/link'
import type { Product, Media, Category } from '../../../payload-types'

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
  const category =
    typeof product.category === 'object'
      ? (product.category as Category)
      : null

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-sm bg-brand-cream">
        {media ? (
          <Image
            src={media.sizes?.card?.url || media.url || ''}
            alt={media.alt || product.name}
            width={media.sizes?.card?.width || 800}
            height={media.sizes?.card?.height || 800}
            placeholder={media.blurDataURL ? 'blur' : 'empty'}
            blurDataURL={media.blurDataURL || undefined}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-brand-cream" />
        )}
      </div>
      <div className="mt-2 px-1">
        <h3 className="text-sm font-medium text-brand-dark truncate">
          {product.name}
        </h3>
        {category && (
          <p className="text-xs text-brand-gray">{category.name}</p>
        )}
      </div>
    </Link>
  )
}
