import React from 'react'
import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import { PricesPanel } from './PricesPanel'

export default function PricesPanelView(props: AdminViewServerProps) {
  const { initPageResult, params, searchParams, payload } = props

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={payload}
      permissions={initPageResult.permissions}
      req={initPageResult.req}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      viewActions={payload.config.admin?.components?.actions}
      visibleEntities={initPageResult.visibleEntities}
    >
      <PricesPanel />
    </DefaultTemplate>
  )
}
