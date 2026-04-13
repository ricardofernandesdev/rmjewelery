import React from 'react'

export const Logo = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.5px', color: 'var(--theme-text)' }}>
        DASHBOARD
      </span>
    </div>
  )
}
