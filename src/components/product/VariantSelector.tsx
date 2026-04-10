'use client'
import React, { useState, useMemo } from 'react'

type ColorTerm = {
  name: string
  hex: string
  images?: any[]
}

type SizeTerm = {
  value: string
}

type Variant = {
  color?: string
  size?: string
  price?: number | null
  availability?: string
  images?: any[]
}

type Props = {
  colorTerms: ColorTerm[]
  sizeTerms: SizeTerm[]
  variants: Variant[]
  basePrice: number
  onSelectionChange?: (selection: {
    color?: ColorTerm
    size?: string
    price: number
    images?: any[]
  }) => void
}

export const VariantSelector: React.FC<Props> = ({
  colorTerms,
  sizeTerms,
  variants,
  basePrice,
  onSelectionChange,
}) => {
  const hasColors = colorTerms.length > 0
  const hasSizes = sizeTerms.length > 0

  const [selectedColor, setSelectedColor] = useState<string>(colorTerms[0]?.name || '')
  const [selectedSize, setSelectedSize] = useState<string>(sizeTerms[0]?.value || '')

  // Find variant for a given combination
  const findVariant = (color?: string, size?: string): Variant | undefined => {
    return variants.find((v) => {
      const colorMatch = !hasColors || v.color === color
      const sizeMatch = !hasSizes || v.size === size
      return colorMatch && sizeMatch
    })
  }

  const currentVariant = useMemo(
    () => findVariant(selectedColor, selectedSize),
    [selectedColor, selectedSize, variants],
  )

  const currentPrice = currentVariant?.price ?? basePrice
  const isOutOfStock = currentVariant?.availability === 'out_of_stock'

  // Check if a size is available for current color
  const isSizeAvailable = (size: string) => {
    const v = findVariant(selectedColor, size)
    return !v || v.availability !== 'out_of_stock'
  }

  // Get images from variant
  const getImages = (_color?: string, variant?: Variant): any[] | undefined => {
    if (variant?.images && variant.images.length > 0) return variant.images
    return undefined
  }

  const notify = (color: string, size: string) => {
    const v = findVariant(color, size)
    const colorTerm = colorTerms.find((c) => c.name === color)
    onSelectionChange?.({
      color: colorTerm,
      size,
      price: v?.price ?? basePrice,
      images: getImages(color, v),
    })
  }

  const handleColorChange = (colorName: string) => {
    setSelectedColor(colorName)
    // Auto-select first available size for this color
    if (hasSizes) {
      const firstAvail = sizeTerms.find((s) => {
        const v = findVariant(colorName, s.value)
        return !v || v.availability !== 'out_of_stock'
      })
      const sz = firstAvail?.value || selectedSize
      setSelectedSize(sz)
      notify(colorName, sz)
    } else {
      notify(colorName, '')
    }
  }

  const handleSizeChange = (size: string) => {
    setSelectedSize(size)
    notify(selectedColor, size)
  }

  return (
    <div className="space-y-3">
      {/* Color swatches */}
      {hasColors && (
        <div className="flex items-center gap-3">
          {colorTerms.map((color) => (
            <button
              key={color.name}
              type="button"
              onClick={() => handleColorChange(color.name)}
              title={color.name}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                color.name === selectedColor
                  ? 'border-brand-dark scale-110 ring-2 ring-offset-2 ring-brand-dark'
                  : 'border-gray-200 hover:border-brand-dark'
              }`}
              style={{ backgroundColor: color.hex }}
            />
          ))}
        </div>
      )}

      {/* Size buttons */}
      {hasSizes && (
        <div className="flex flex-wrap gap-2">
          {sizeTerms.map(({ value }) => {
            const available = isSizeAvailable(value)
            return (
              <button
                key={value}
                type="button"
                onClick={() => available && handleSizeChange(value)}
                className={`min-w-[44px] px-3 py-2 text-sm border transition-colors ${
                  value === selectedSize
                    ? 'border-brand-dark bg-brand-dark text-white'
                    : !available
                      ? 'border-gray-200 text-brand-gray/40 line-through cursor-not-allowed'
                      : 'border-gray-200 text-brand-dark hover:border-brand-dark'
                }`}
                disabled={!available}
              >
                {value}
              </button>
            )
          })}
        </div>
      )}

      {/* Price */}
      <p className="text-xl font-semibold text-brand-dark">
        {currentPrice.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
      </p>

      {isOutOfStock && (
        <p className="text-sm text-red-500 font-medium">Esgotado</p>
      )}
    </div>
  )
}
