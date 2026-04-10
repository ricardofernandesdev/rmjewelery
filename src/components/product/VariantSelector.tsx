'use client'
import React, { useState, useMemo } from 'react'

type SizeEntry = {
  value: string
  price?: number | null
  availability?: string
}

type Color = {
  name: string
  hex: string
  price?: number | null
  availability?: string
  images?: any[]
  sizes?: SizeEntry[]
}

type Props = {
  colors: Color[]
  sizes: SizeEntry[]
  basePrice: number
  onSelectionChange?: (selection: { color?: Color; size?: string; images?: any[] }) => void
}

export const VariantSelector: React.FC<Props> = ({
  colors,
  sizes,
  basePrice,
  onSelectionChange,
}) => {
  const [selectedColor, setSelectedColor] = useState<string>(colors[0]?.name || '')
  const [selectedSize, setSelectedSize] = useState<string>('')

  const hasColors = colors.length > 0
  const hasSizes = sizes.length > 0

  // Get the active color object
  const activeColor = useMemo(
    () => colors.find((c) => c.name === selectedColor),
    [colors, selectedColor],
  )

  // Determine which sizes to show
  const activeSizes = useMemo(() => {
    // If colors have embedded sizes, use those
    if (hasColors && activeColor?.sizes && activeColor.sizes.length > 0) {
      return activeColor.sizes
    }
    // Otherwise use product-level sizes
    return sizes
  }, [hasColors, activeColor, sizes])

  // Auto-select first size
  useMemo(() => {
    if (activeSizes.length > 0 && !selectedSize) {
      const firstAvailable = activeSizes.find((s) => s.availability !== 'out_of_stock')
      setSelectedSize(firstAvailable?.value || activeSizes[0].value)
    }
  }, [activeSizes])

  // Current price
  const currentPrice = useMemo(() => {
    if (activeSizes.length > 0) {
      const sizeEntry = activeSizes.find((s) => s.value === selectedSize)
      if (sizeEntry?.price != null) return sizeEntry.price
    }
    if (activeColor?.price != null) return activeColor.price
    return basePrice
  }, [activeSizes, selectedSize, activeColor, basePrice])

  // Current availability
  const isOutOfStock = useMemo(() => {
    if (activeSizes.length > 0) {
      const sizeEntry = activeSizes.find((s) => s.value === selectedSize)
      return sizeEntry?.availability === 'out_of_stock'
    }
    return activeColor?.availability === 'out_of_stock'
  }, [activeSizes, selectedSize, activeColor])

  const handleColorChange = (colorName: string) => {
    setSelectedColor(colorName)
    const color = colors.find((c) => c.name === colorName)

    // Reset size to first available for new color
    const newSizes = color?.sizes && color.sizes.length > 0 ? color.sizes : sizes
    const firstAvailable = newSizes.find((s) => s.availability !== 'out_of_stock')
    setSelectedSize(firstAvailable?.value || newSizes[0]?.value || '')

    onSelectionChange?.({
      color,
      size: firstAvailable?.value || '',
      images: color?.images,
    })
  }

  const handleSizeChange = (size: string) => {
    setSelectedSize(size)
    onSelectionChange?.({
      color: activeColor,
      size,
      images: activeColor?.images,
    })
  }

  return (
    <div className="space-y-5">
      {/* Color swatches */}
      {hasColors && (
        <div className="flex items-center gap-3">
          {colors.map((color) => (
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
      {activeSizes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeSizes.map((size) => {
            const available = size.availability !== 'out_of_stock'
            return (
              <button
                key={size.value}
                type="button"
                onClick={() => available && handleSizeChange(size.value)}
                className={`min-w-[44px] px-3 py-2 text-sm border transition-colors ${
                  size.value === selectedSize
                    ? 'border-brand-dark bg-brand-dark text-white'
                    : !available
                      ? 'border-gray-200 text-brand-gray/40 line-through cursor-not-allowed'
                      : 'border-gray-200 text-brand-dark hover:border-brand-dark'
                }`}
                disabled={!available}
              >
                {size.value}
              </button>
            )
          })}
        </div>
      )}

      {/* Price */}
      <p className="text-xl font-semibold text-brand-dark">
        {currentPrice.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
      </p>

      {/* Out of stock */}
      {isOutOfStock && (
        <p className="text-sm text-red-500 font-medium">Esgotado</p>
      )}
    </div>
  )
}
