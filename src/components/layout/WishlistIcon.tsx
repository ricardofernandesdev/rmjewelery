'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'

export const WishlistIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const update = () => {
      try {
        const list = JSON.parse(localStorage.getItem('rm-wishlist') || '[]')
        setCount(Array.isArray(list) ? list.length : 0)
      } catch {
        setCount(0)
      }
    }
    update()
    window.addEventListener('wishlist-change', update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener('wishlist-change', update)
      window.removeEventListener('storage', update)
    }
  }, [])

  return (
    <Link href="/wishlist" aria-label="Favoritos" className={`relative ${className}`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
