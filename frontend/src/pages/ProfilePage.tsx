import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../i18n'
import { useAuthStore } from '../store/authStore'
import { getProfile, updateProfile, deleteAccount } from '../api/profile'
import { avatarGradient } from '../lib/avatar'
import AppLayout from '../components/layout/AppLayout'

export default function ProfilePage() {
  const t = useT()
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuthStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getProfile().then((p) => {
      setFullName(p.full_name ?? '')
      setAvatar(p.avatar)
    }).catch(() => {})
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const updated = await updateProfile({ full_name: fullName.trim() || undefined, avatar })
      updateUser({ full_name: updated.full_name, avatar: updated.avatar })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      await deleteAccount()
      logout()
      navigate('/auth')
    } catch {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const initials = (user?.full_name ?? user?.phone ?? '?')[0].toUpperCase()
  const gradientClass = avatarGradient(user?.full_name ?? user?.phone ?? '?')

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{t.profile}</h1>
        </div>

        {/* Avatar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 mb-4">
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => fileRef.current?.click()}
              className="relative group"
              type="button"
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="avatar"
                  className="h-20 w-20 rounded-full object-cover shadow-md"
                />
              ) : (
                <div className={`h-20 w-20 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-2xl font-bold text-white shadow-md`}>
                  {initials}
                </div>
              )}
              <span className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
              type="button"
            >
              {t.uploadPhoto}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        </div>

        {/* Name + phone */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 mb-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.fullName}</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30"
              placeholder={t.namePlaceholder}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.phone}</label>
            <input
              type="text"
              value={user?.phone ?? ''}
              readOnly
              className="w-full rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-100 dark:bg-gray-750 px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-4 py-3 text-sm font-semibold text-white transition mb-6"
        >
          {saving ? '...' : saved ? `✓ ${t.profileSaved}` : t.save}
        </button>

        {/* Delete account */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-100 dark:border-red-900/30 p-4">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">{t.deleteAccount}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{t.deleteAccountConfirm}</p>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
          >
            {t.deleteAccount}
          </button>
        </div>
      </div>

      {/* Delete account confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2 text-center">{t.deleteAccount}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5 text-center">{t.deleteAccountConfirm}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition"
              >
                {deleting ? '...' : t.deleteAccountYes}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
