import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useBusinessStore, type Business } from '../../store/businessStore'
import { getBusinesses, createBusiness, updateBusiness, deleteBusiness } from '../../api/businesses'
import { useT } from '../../i18n'

const BuildingIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)
const ChevronIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="shrink-0 opacity-50">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)
const XIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const PencilIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)
const TrashIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

export default function BusinessSwitcher({ isMobile }: { isMobile?: boolean }) {
  const t = useT()
  const currentUserId = useAuthStore((s) => s.user?.id)
  const { activeBusiness, setActiveBusiness } = useBusinessStore()
  const [open, setOpen] = useState(false)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function resetForm() {
    setEditingId(null)
    setAdding(false)
    setNameInput('')
    setError('')
    setDeleteConfirmId(null)
  }

  function closeModal() {
    setOpen(false)
    resetForm()
  }

  async function loadBusinesses() {
    try {
      const list = await getBusinesses()
      setBusinesses(list)
      return list
    } catch {
      return []
    }
  }

  useEffect(() => { loadBusinesses() }, [])

  // Auto-select first valid business if stored one is gone
  useEffect(() => {
    if (!businesses.length) return
    const valid = businesses.find((b) => b.id === activeBusiness?.id)
    if (!valid) setActiveBusiness(businesses[0])
  }, [businesses]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSwitch(b: Business) {
    setActiveBusiness(b)
    closeModal()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nameInput.trim()) { setError(t.errBusinessNameRequired); return }
    setSaving(true)
    setError('')
    try {
      if (adding) {
        const b = await createBusiness({ name: nameInput.trim() })
        const list = await loadBusinesses()
        const fresh = list.find((x) => x.id === b.id) ?? b
        setActiveBusiness(fresh)
        setAdding(false)
        setNameInput('')
      } else if (editingId !== null) {
        const b = await updateBusiness(editingId, { name: nameInput.trim() })
        await loadBusinesses()
        if (activeBusiness?.id === editingId) setActiveBusiness(b)
        setEditingId(null)
        setNameInput('')
      }
    } catch {
      setError(t.errNetwork)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    setSaving(true)
    setError('')
    try {
      await deleteBusiness(id)
      const list = await loadBusinesses()
      if (activeBusiness?.id === id && list.length) setActiveBusiness(list[0])
      setDeleteConfirmId(null)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg === 'Cannot delete: has active debts' ? t.businessHasDebts : t.errNetwork)
      setDeleteConfirmId(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={[
          'flex items-center gap-2 w-full rounded-xl px-3 py-2 text-sm font-medium transition-all text-left',
          isMobile
            ? 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
            : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50',
        ].join(' ')}
      >
        <BuildingIcon />
        <span className="flex-1 truncate min-w-0">{activeBusiness?.name ?? t.loading}</span>
        <ChevronIcon />
      </button>

      {/* Full modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">{t.myBusinesses}</h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <XIcon />
              </button>
            </div>

            {/* Business list */}
            <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
              {businesses.map((b) => {
                const isActive = activeBusiness?.id === b.id
                return (
                  <li key={b.id}>
                    {deleteConfirmId === b.id ? (
                      <div className="flex items-center gap-2 px-5 py-3 bg-red-50 dark:bg-red-900/20">
                        <p className="flex-1 text-xs text-red-600 dark:text-red-400">
                          {t.confirmDeleteBusiness}
                        </p>
                        <button
                          onClick={() => handleDelete(b.id)}
                          disabled={saving}
                          className="shrink-0 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition"
                        >
                          {t.deleteBusiness}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="shrink-0 text-xs text-gray-500 dark:text-gray-400 px-2 py-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition"
                        >
                          {t.cancel}
                        </button>
                      </div>
                    ) : editingId === b.id ? (
                      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-5 py-3">
                        <input
                          autoFocus
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder={t.businessNamePlaceholder}
                          className="flex-1 min-w-0 text-sm rounded-xl px-3 py-2 border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600"
                        />
                        <button
                          type="submit"
                          disabled={saving}
                          className="shrink-0 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-xl transition"
                        >
                          {t.save}
                        </button>
                        <button
                          type="button"
                          onClick={resetForm}
                          className="shrink-0 text-xs text-gray-500 dark:text-gray-400 px-2 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                          {t.cancel}
                        </button>
                      </form>
                    ) : (
                      <div className={`flex items-center gap-3 px-5 py-3.5 group ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'} transition-colors`}>
                        {/* Switch button (left side) */}
                        <button
                          onClick={() => handleSwitch(b)}
                          className="flex-1 flex items-center gap-3 text-left min-w-0"
                        >
                          <span className={`h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${isActive ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                            {isActive && <CheckIcon />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className={`text-sm truncate block ${isActive ? 'font-bold text-indigo-700 dark:text-indigo-300' : 'font-medium text-gray-800 dark:text-gray-200'}`}>
                              {b.name}
                            </span>
                            {b.owner_id !== currentUserId && (
                              <span className="text-[10px] text-gray-400 dark:text-gray-500">{t.employeeLabel}</span>
                            )}
                          </div>
                        </button>

                        {/* Action buttons — only for owned businesses */}
                        {b.owner_id === currentUserId && (
                          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingId(b.id); setNameInput(b.name); setAdding(false); setError('') }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                              title={t.editBusiness}
                            >
                              <PencilIcon />
                            </button>
                            {businesses.filter((x) => x.owner_id === currentUserId).length > 1 && (
                              <button
                                onClick={() => setDeleteConfirmId(b.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                title={t.deleteBusiness}
                              >
                                <TrashIcon />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>

            {/* Add business */}
            <div className="border-t border-gray-100 dark:border-gray-700">
              {adding ? (
                <form onSubmit={handleSubmit} className="flex items-center gap-2 px-5 py-3">
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder={t.businessNamePlaceholder}
                    className="flex-1 min-w-0 text-sm rounded-xl px-3 py-2 border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="shrink-0 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-xl transition"
                  >
                    {t.save}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="shrink-0 text-xs text-gray-500 dark:text-gray-400 px-2 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    {t.cancel}
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => { setAdding(true); setEditingId(null); setNameInput(''); setError('') }}
                  className="w-full text-left text-sm font-semibold text-indigo-600 dark:text-indigo-400 px-5 py-3.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                >
                  {t.addBusiness}
                </button>
              )}
            </div>

            {error && (
              <p className="text-xs text-red-500 dark:text-red-400 px-5 pb-3">{error}</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
