import React from 'react'

export const NavHeader = () => {
  return (
    <a
      href="/admin"
      style={{
        display: 'block',
        marginBottom: '24px',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.5px', color: 'var(--theme-text)' }}>
        PAINEL
      </div>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '2px',
          color: 'var(--theme-elevation-500)',
          marginTop: '2px',
        }}
      >
        ADMIN_V1
      </div>
    </a>
  )
}
