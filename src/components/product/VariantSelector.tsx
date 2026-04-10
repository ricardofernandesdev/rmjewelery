'use client'
import React, { useState, useMemo } from 'react'

type Color = {
  name: string
  hex: string
  images?: any[]
}

type Size = {
  value: string
}

type VariantOverride = {
  color?: string
  size?: string
  price?: number | null
  availability?: string
}

type Props = {
  colors: Color[]
  sizes: Size[]
  variants: VariantOverride[]
  basePrice: number
  onSelectionChange?: (selection: { color?: Color; size?: string; images?: any[] }) => void
}

export const VariantSelector: React.FC<Props> = ({
  colors,
  sizes,
  variants,
  basePrice,
  onSelectionChange,
}) => {
  const [selectedColor, setSelectedColor] = useState<string>(colors[0]?.name || '')
  const [selectedSize, setSelectedSize] = useState<string>(sizes[0]?.value || '')

  const hasColors = colors.length > 0
  const hasSizes = sizes.length > 0

  // Find override for current combination
  const getOverride = (color?: string, size?: string): VariantOverride | undefined => {
    return variants.find((v) => {
      const colorMatch = !v.color || v.color === color
      const sizeMatch = !v.size || v.size === size
      return colorMatch && sizeMatch
    })
  }

  const currentOverride = useMemo(() => {
    return getOverride(selectedColor, selectedSize)
  }, [selectedColor, selectedSize, variants])

  const currentPrice = currentOverride?.price ?? basePrice
  const isOutOfStock = currentOverride?.availability === 'out_of_stock'

  // Check if a size is out of stock for current color
  const isSizeAvailable = (size: string) => {
    const override = getOverride(selectedColor, size)
    return override?.availability !== 'out_of_stock'
  }

  const handleColorChange = (colorName: string) => {
    setSelectedColor(colorName)
    const color = colors.find((c) => c.name === colorName)
    onSelectionChange?.({
      color,
      size: selectedSize,
      images: color?.images,
    })
  }

  const handleSizeChange = (size: string) => {
    setSelectedSize(size)
    const color = colors.find((c) => c.name === selectedColor)
    onSelectionChange?.({
      color,
      size,
      images: color?.images,
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
      {hasSizes && (
        <div className="flex flex-wrap gap-2">
          {sizes.map(({ value }) => {
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

      {/* Out of stock */}
      {isOutOfStock && (
        <p className="text-sm text-red-500 font-medium">Esgotado</p>
      )}
    </div>
  )
}
