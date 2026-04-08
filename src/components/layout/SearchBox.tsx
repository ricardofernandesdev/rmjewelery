'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  initialValue?: string
  autoFocus?: boolean
  compact?: boolean
}

export const SearchBox: React.FC<Props> = ({ initialValue = '', autoFocus = false, compact = false }) => {
  const [value, setValue] = useState(initialValue)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex items-center ${compact ? 'w-full max-w-[280px]' : 'w-full'}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="absolute left-3 w-4 h-4 text-brand-gray pointer-events-none"
        aria-hidden="true"
      >
        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Procurar produtos..."
        aria-label="Procurar produtos"
        className="w-full pl-10 pr-4 py-2 text-sm bg-brand-cream/40 border border-gray-200 rounded-full text-brand-dark placeholder-brand-gray focus:outline-none focus:border-brand-dark transition-colors"
      />
    </form>
  )
}
