import React from 'react'

type Props = { data: unknown }

export const JsonLd: React.FC<Props> = ({ data }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
)
