'use client'
import React from 'react'
import { usePathname } from 'next/navigation'

export const MainWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <main
      className={`flex-1 ${
        isHome
          ? 'pt-[var(--admin-bar-h,0px)]'
          : 'pt-[calc(140px+var(--admin-bar-h,0px))]'
      }`}
    >
      {children}
    </main>
  )
}
