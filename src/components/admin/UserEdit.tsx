'use client'
import React, { useState, useEffect, useRef } from 'react'
import { ConfirmModal } from './ConfirmModal'
import './AccountView.scss'
import './ConfirmModal.scss'

export const UserEdit: React.FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarId, setAvatarId] = useState<string | null>(null)
  const [newAvatar, setNewAvatar] = useState<File | null>(null)
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [isCreate, setIsCreate] = useState(false)
  const [modal, setModal] = useState<any>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const path = window.location.pathname
    const match = path.match(/\/admin\/collections\/users\/(\d+)/)

    if (match) {
      const id = match[1]
      setUserId(id)
      fetch(`/api/users/${id}`, { credentials: 'include' })
        .then((r) => r.json())
        .then((user) => {
          if (user) {
            setName(user.name || '')
            setEmail(user.email || '')
            setUpdatedAt(user.updatedAt || null)
            if (user.avatar) {
              const av = typeof user.avatar === 'object' ? user.avatar : null
              if (av) {
                setAvatarUrl(av.sizes?.thumbnail?.url || av.url || '')
                setAvatarId(av.id)
              } else {
                fetch(`/api/media/${user.avatar}`, { credentials: 'include' })
                  .then((r) => r.json())
                  .then((m) => {
                    setAvatarUrl(m?.sizes?.thumbnail?.url || m?.url || '')
                    setAvatarId(m?.id)
                  })
              }
            }
          }
          setLoaded(true)
        })
    } else {
      setIsCreate(true)
      setLoaded(true)
    }
  }, [])

  const handleAvatarSelect = (f: File) => {
    setNewAvatar(f)
    const reader = new FileReader()
    reader.onload = (e) => setNewAvatarPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  const handleDeleteAvatar = () => {
    setModal({
      title: 'Remover foto de perfil',
      message: 'Tens a certeza que queres remover a foto de perfil?',
      confirmLabel: 'Remover',
      onConfirm: () => {
        setAvatarUrl(null)
        setAvatarId(null)
        setNewAvatar(null)
        setNewAvatarPreview(null)
        setModal(null)
      },
    })
  }

  const handleSave = async () => {
    if (isCreate && !email) {
      alert('Email é obrigatório')
      return
    }
    if ((isCreate || showPasswordChange) && password !== confirmPassword) {
      alert('As palavras-passe não coincidem')
      return
    }
    if (isCreate && !password) {
      alert('Palavra-passe é obrigatória')
      return
    }
    setSaving(true)

    try {
      let newAvatarMediaId = avatarId
      if (newAvatar) {
        const formData = new FormData()
        formData.append('file', newAvatar)
        formData.append('_payload', JSON.stringify({ alt: `Avatar de ${name || email}` }))
        const res = await fetch('/api/media', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })
        const mediaData = await res.json()
        if (mediaData?.doc?.id) {
          newAvatarMediaId = mediaData.doc.id
        }
      }

      if (isCreate) {
        const body: any = { email, name, password, avatar: newAvatarMediaId || null }
        const res = await fetch('/api/users', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          window.location.href = '/admin/collections/users'
        } else {
          const err = await res.json()
          alert(err?.errors?.[0]?.message || 'Erro ao criar utilizador')
        }
      } else {
        const body: any = { name, avatar: newAvatarMediaId || null }
        if (showPasswordChange && password) {
          body.password = password
        }
        await fetch(`/api/users/${userId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        window.location.href = '/admin/collections/users'
      }
    } catch {
      alert('Erro ao guardar')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }) + ' ÀS ' + d.toLocaleTimeString('pt-PT', {
      hour: '2-digit', minute: '2-digit',
    })
  }

  if (!loaded) return null

  const displayAvatar = newAvatarPreview || avatarUrl

  return (
    <div className="account-view">
      {modal && (
        <ConfirmModal
          title={modal.title}
          message={modal.message}
          confirmLabel={modal.confirmLabel}
          cancelLabel="Cancelar"
          danger
          onConfirm={modal.onConfirm}
          onCancel={() => setModal(null)}
        />
      )}

      <div className="account-view__top">
        <div>
          <h1 className="account-view__title">
            {isCreate ? 'NOVO UTILIZADOR' : 'EDITAR UTILIZADOR'}
          </h1>
          <p className="account-view__subtitle">
            {isCreate
              ? 'CRIAR NOVA CONTA DE UTILIZADOR'
              : 'ATUALIZAR CREDENCIAIS E PERFIL DO UTILIZADOR'}
          </p>
        </div>
      </div>

      <div className="account-view__layout">
        {/* Left — Profile Picture */}
        <div className="account-view__avatar-section">
          <p className="account-view__label">FOTO DE PERFIL</p>
          <div className="account-view__avatar-frame">
            {displayAvatar ? (
              <img src={displayAvatar} alt="Avatar" />
            ) : (
              <div className="account-view__avatar-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>
          <div className="account-view__avatar-actions">
            <button
              type="button"
              className="account-view__avatar-btn account-view__avatar-btn--edit"
              onClick={() => fileRef.current?.click()}
            >
              EDITAR
            </button>
            {displayAvatar && (
              <button
                type="button"
                className="account-view__avatar-btn account-view__avatar-btn--delete"
                onClick={handleDeleteAvatar}
              >
                APAGAR
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleAvatarSelect(f)
            }}
          />
        </div>

        {/* Right — Form fields */}
        <div className="account-view__fields">
          <div className="account-view__field">
            <label className="account-view__label">NOME</label>
            <input
              type="text"
              className="account-view__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="account-view__field">
            <label className="account-view__label">ENDEREÇO DE EMAIL</label>
            <input
              type="email"
              className="account-view__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isCreate}
            />
          </div>

          <div className="account-view__field">
            <label className="account-view__label">PALAVRA-PASSE</label>
            {!isCreate && !showPasswordChange ? (
              <div className="account-view__password-row">
                <input
                  type="password"
                  className="account-view__input"
                  value="••••••••••••"
                  disabled
                />
                <button
                  type="button"
                  className="account-view__change-btn"
                  onClick={() => setShowPasswordChange(true)}
                >
                  ALTERAR
                </button>
              </div>
            ) : (
              <div className="account-view__password-fields">
                <input
                  type="password"
                  className="account-view__input"
                  placeholder="Palavra-passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <input
                  type="password"
                  className="account-view__input"
                  placeholder="Confirmar palavra-passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="account-view__footer">
        <div className="account-view__updated">
          {updatedAt && (
            <>
              <span className="account-view__updated-dot" />
              ÚLTIMA ATUALIZAÇÃO {formatDate(updatedAt)}
            </>
          )}
        </div>
        <div className="account-view__footer-actions">
          <a href="/admin/collections/users" className="account-view__cancel-btn">CANCELAR</a>
          <button
            type="button"
            className="account-view__save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'A GUARDAR...' : isCreate ? 'CRIAR UTILIZADOR' : 'GUARDAR ALTERAÇÕES'}
          </button>
        </div>
      </div>
    </div>
  )
}
