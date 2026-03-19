import React from 'react'
import type { ListViewServerProps } from 'payload'
import { MediaListClient } from './MediaListClient'
import './MediaList.scss'

export const MediaList: React.FC<ListViewServerProps> = async (props) => {
  const { data } = props
  const docs = (data as any)?.docs || []
  const totalDocs = (data as any)?.totalDocs || 0
  const totalPages = (data as any)?.totalPages || 1
  const currentPage = (data as any)?.page || 1

  const serializedDocs = docs.map((doc: any) => ({
    id: doc.id,
    filename: doc.filename,
    alt: doc.alt || '',
    mimeType: doc.mimeType || '',
    thumbnailUrl: doc.sizes?.thumbnail?.url || '',
  }))

  return (
    <MediaListClient
      docs={serializedDocs}
      totalDocs={totalDocs}
      totalPages={totalPages}
      currentPage={currentPage}
    />
  )
}
