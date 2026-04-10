'use client'
import React, { useEffect, useState } from 'react'

type WishlistItem = {
  id: string | number
  name: string
  slug: string
  price?: number
  imageUrl?: string | null
}

const STORAGE_KEY = 'rm-wishlist'

function readWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function writeWishlist(items: WishlistItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  // Notify other components in the same tab
  window.dispatchEvent(new CustomEvent('wishlist-change'))
}

export function addToWishlist(item: WishlistItem) {
  const list = readWishlist()
  if (!list.some((i) => String(i.id) === String(item.id))) {
    writeWishlist([item, ...list])
  }
}

export function removeFromWishlist(id: string | number) {
  const list = readWishlist().filter((i) => String(i.id) !== String(id))
  writeWishlist(list)
}

export function isInWishlist(id: string | number): boolean {
  return readWishlist().some((i) => String(i.id) === String(id))
}

type Props = {
  item: WishlistItem
  className?: string
  size?: number
}

export const WishlistButton: React.FC<Props> = ({ item, className = '', size = 18 }) => {
  const [active, setActive] = useState(false)

  useEffect(() => {
    setActive(isInWishlist(item.id))
    const handler = () => setActive(isInWishlist(item.id))
    window.addEventListener('wishlist-change', handler)
    return () => window.removeEventListener('wishlist-change', handler)
  }, [item.id])

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (active) {
      removeFromWishlist(item.id)
    } else {
      addToWishlist(item)
    }
    setActive(!active)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      title={active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className={`transition-colors ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    </button>
  )
}
