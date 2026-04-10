'use client'
import React, { useState } from 'react'
import { ProductGallery } from './ProductGallery'
import { VariantSelector } from './VariantSelector'
import type { Media } from '../../../payload-types'

type Variant = {
  name: string
  price?: number | null
  availability?: string
  images?: any[]
}

type Props = {
  mainImages: Media[]
  variants: Variant[]
  basePrice: number
  children?: React.ReactNode
}

export const ProductDetailClient: React.FC<Props> = ({
  mainImages,
  variants,
  basePrice,
  children,
}) => {
  const [activeImages, setActiveImages] = useState<Media[]>(mainImages)

  const handleVariantChange = (variant: Variant) => {
    if (variant.images && variant.images.length > 0) {
      const variantMedia = variant.images.filter(
        (img: any): img is Media => typeof img === 'object' && img !== null,
      )
      if (variantMedia.length > 0) {
        // Variant images first, then main images (without duplicates)
        const variantIds = new Set(variantMedia.map((m) => m.id))
        const remaining = mainImages.filter((m) => !variantIds.has(m.id))
        setActiveImages([...variantMedia, ...remaining])
        return
      }
    }
    setActiveImages(mainImages)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      {/* Gallery */}
      <ProductGallery images={activeImages} />

      {/* Product info */}
      <div className="flex flex-col gap-4">
        {children}

        {variants.length > 0 ? (
          <VariantSelector
            variants={variants}
            basePrice={basePrice}
            onVariantChange={handleVariantChange}
          />
        ) : (
          basePrice > 0 && (
            <p className="text-xl font-semibold text-brand-dark">
              {basePrice.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            </p>
          )
        )}
      </div>
    </div>
  )
}
