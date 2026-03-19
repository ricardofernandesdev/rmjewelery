'use client'
import React, { useEffect, useState } from 'react'

export const UserAvatar: React.FC = () => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [initials, setInitials] = useState('U')

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/users/me', { credentials: 'include' })
        const data = await res.json()
        const user = data?.user

        if (user?.name) {
          const parts = user.name.trim().split(' ')
          const ini = parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : parts[0].substring(0, 2).toUpperCase()
          setInitials(ini)
        } else if (user?.email) {
          setInitials(user.email.substring(0, 2).toUpperCase())
        }

        if (user?.avatar) {
          const avatarId = typeof user.avatar === 'object' ? user.avatar.id : user.avatar
          if (avatarId) {
            const mediaRes = await fetch(`/api/media/${avatarId}`, { credentials: 'include' })
            const mediaData = await mediaRes.json()
            const url = mediaData?.sizes?.thumbnail?.url || mediaData?.url
            if (url) setAvatarUrl(url)
          }
        }
      } catch {
        // silently fail
      }
    }
    fetchUser()
  }, [])

  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: avatarUrl ? 'transparent' : 'var(--theme-text)',
        color: 'var(--theme-bg)',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.5px',
        flexShrink: 0,
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Avatar"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        initials
      )}
    </div>
  )
}
