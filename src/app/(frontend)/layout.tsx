import React, { type CSSProperties } from 'react'
import { headers as nextHeaders, cookies as nextCookies } from 'next/headers'
import '../globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MainWrapper } from '@/components/layout/MainWrapper'
import { DiamondLoader } from '@/components/layout/DiamondLoader'
import { SiteStatusGate } from '@/components/layout/SiteStatusGate'
import { AdminBarClient } from '@/components/layout/AdminBarClient'
import { Toast } from '@/components/ui/Toast'
import { getSiteSettings } from '@/lib/queries'
import { getPayload } from '@/lib/payload'

export const revalidate = 60

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings().catch(() => null)

  // Short-circuit: if there is no Payload session cookie at all, we know the
  // visitor is anonymous and can skip the auth() call (which otherwise hits
  // the database on every request).
  let isAuthenticated = false
  const cookieStore = await nextCookies()
  const hasSessionCookie = cookieStore.getAll().some((c) => c.name.includes('payload-token'))

  if (hasSessionCookie) {
    try {
      const payload = await getPayload()
      const headers = await nextHeaders()
      const { user } = await payload.auth({ headers })
      isAuthenticated = Boolean(user)
    } catch {
      isAuthenticated = false
    }
  }

  if (settings?.maintenanceMode && !isAuthenticated) {
    return (
      <SiteStatusGate
        mode="maintenance"
        message={settings.maintenanceMessage || 'Estamos a fazer melhorias. Voltamos em breve.'}
      />
    )
  }

  if (settings?.comingSoon && !isAuthenticated) {
    return (
      <SiteStatusGate
        mode="coming-soon"
        message={settings.comingSoonMessage || 'Estamos a preparar algo especial. Em breve.'}
      />
    )
  }

  const rootStyle: CSSProperties | undefined = isAuthenticated
    ? ({ ['--admin-bar-h' as any]: '40px' } as CSSProperties)
    : undefined

  return (
    <div
      className="font-body min-h-screen flex flex-col bg-white relative"
      style={rootStyle}
    >
      <DiamondLoader />
      <Toast />
      {isAuthenticated && <AdminBarClient />}
      <Header />
      <MainWrapper>{children}</MainWrapper>
      <Footer />
    </div>
  )
}
