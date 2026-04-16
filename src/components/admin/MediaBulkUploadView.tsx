import React from 'react'
import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import { MediaBulkUpload } from './MediaBulkUpload'

export default function MediaBulkUploadView(props: AdminViewServerProps) {
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
      visibleEntities={initPageResult.visibleEntities}
    >
      <MediaBulkUpload />
    </DefaultTemplate>
  )
}
