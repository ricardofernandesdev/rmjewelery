'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Media } from '../../../payload-types'

type ProductGalleryProps = {
  images: Media[]
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-brand-cream rounded-sm" />
    )
  }

  const mainImage = images[selectedIndex]

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-brand-cream">
        <Image
          src={mainImage.sizes?.detail?.url || mainImage.url || ''}
          alt={mainImage.alt || ''}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          placeholder={mainImage.blurDataURL ? 'blur' : 'empty'}
          blurDataURL={mainImage.blurDataURL || undefined}
          className="object-cover"
          priority
        />
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative shrink-0 w-16 h-16 rounded-sm overflow-hidden transition-opacity ${
                index === selectedIndex
                  ? 'ring-2 ring-brand-dark opacity-100'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={image.sizes?.thumbnail?.url || image.url || ''}
                alt={image.alt || ''}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
