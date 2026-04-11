'use client'
import React from 'react'
import { usePathname } from 'next/navigation'

type Props = {
  children: React.ReactNode
  isAuthenticated?: boolean
}

export const MainWrapper: React.FC<Props> = ({ children, isAuthenticated = false }) => {
  const pathname = usePathname()
  const isHome = pathname === '/'

  // Offsets:
  //  - home: hero is full-bleed, only needs the admin bar offset (0 or 40px)
  //  - other pages: fixed header is 140px tall, plus the admin bar offset
  const padClass = isHome
    ? isAuthenticated
      ? 'pt-10'
      : ''
    : isAuthenticated
      ? 'pt-[180px]'
      : 'pt-[140px]'

  return <main className={`flex-1 ${padClass}`}>{children}</main>
}
