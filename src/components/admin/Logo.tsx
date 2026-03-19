import React from 'react'

export const Logo = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.5px', color: 'var(--theme-text)' }}>
        DASHBOARD
      </span>
      <span
        style={{
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'var(--theme-elevation-500)',
        }}
      >
        ADMIN_V1
      </span>
    </div>
  )
}
