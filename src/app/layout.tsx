import React from 'react'
import { Manrope } from 'next/font/google'

const manrope = Manrope({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={manrope.variable}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
