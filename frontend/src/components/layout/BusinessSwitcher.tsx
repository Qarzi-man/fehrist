import { useState, useEffect, useRef } from 'react'
import { useBusinessStore, type Business } from '../../store/businessStore'
import { getBusinesses, createBusiness, updateBusiness, deleteBusiness } from '../../api/businesses'
import { useT } from '../../i18n'

const BuildingIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
    className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)
const PencilIcon = () => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)
const TrashIcon = () => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

export default function BusinessSwitcher({ isMobile }: { isMobile?: boolean }) {
  const t = useT()
  const { activeBusiness, setActiveBusiness } = useBusinessStore()
  const [open, setOpen] = useState(false)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  function resetForm() {
    setEditingId(null)
    setAdding(false)
    setNameInput('')
    setError('')
    setDeleteConfirmId(null)
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

  useEffect(() => {
    loadBusinesses()
  }, [])

  // Auto-select first valid business
  useEffect(() => {
    if (!businesses.length) return
    const valid = businesses.find((b) => b.id === activeBusiness?.id)
    if (!valid) setActiveBusiness(businesses[0])
  }, [businesses]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        resetForm()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleToggle() {
    setOpen((v) => !v)
    if (open) resetForm()
  }

  function handleSwitch(b: Business) {
    setActiveBusiness(b)
    setOpen(false)
    resetForm()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nameInput.trim()) { setError(t.errBusinessNameRequired); return }
    setLoading(true)
    setError('')
    try {
      if (adding) {
        const b = await createBusiness({ name: nameInput.trim() })
        const list = await loadBusinesses()
        const created = list.find((x) => x.id === b.id) ?? b
        setActiveBusiness(created)
      } else if (editingId !== null) {
        const b = await updateBusiness(editingId, { name: nameInput.trim() })
        await loadBusinesses()
        if (activeBusiness?.id === editingId) setActiveBusiness(b)
      }
      resetForm()
    } catch {
      setError(t.errNetwork)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    setLoading(true)
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
      setLoading(false)
    }
  }

  return (
    <div className={`relative ${isMobile ? 'w-full' : ''}`} ref={ref}>
      {/* Trigger */}
      <button
        onClick={handleToggle}
        className={[
          'flex items-center gap-2 w-full rounded-xl px-3 py-2 text-sm font-medium transition-all',
          isMobile
            ? 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
            : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50',
        ].join(' ')}
      >
        <BuildingIcon />
        <span className="flex-1 text-left truncate min-w-0">
          {activeBusiness?.name ?? t.loading}
        </span>
        <ChevronIcon open={open} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className={[
          'absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
          'rounded-xl shadow-xl overflow-hidden min-w-[200px]',
          isMobile ? 'left-0 right-0 top-full mt-1' : 'left-0 right-0 top-full mt-1',
        ].join(' ')}>

          {/* Business list */}
          {businesses.map((b) => (
            <div key={b.id} className="group relative">
              {deleteConfirmId === b.id ? (
                <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-red-50 dark:bg-red-900/20">
                  <span className="text-xs text-red-600 dark:text-red-400 flex-1 min-w-0">
                    {t.confirmDeleteBusiness}
                  </span>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={loading}
                      className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded-lg transition"
                    >
                      {t.deleteBusiness}
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      {t.cancel}
                    </button>
                  </div>
                </div>
              ) : editingId === b.id ? (
                <form onSubmit={handleSubmit} className="flex items-center gap-1 px-2 py-1.5">
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder={t.businessNamePlaceholder}
                    className="flex-1 min-w-0 text-sm rounded-lg px-2 py-1 border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded-lg transition shrink-0"
                  >
                    {t.save}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs text-gray-500 dark:text-gray-400 px-1.5 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition shrink-0"
                  >
                    {t.cancel}
                  </button>
                </form>
              ) : (
                <div className="flex items-center pr-1">
                  <button
                    onClick={() => handleSwitch(b)}
                    className="flex-1 flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
                  >
                    <span className={[
                      'h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center',
                      activeBusiness?.id === b.id
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-gray-300 dark:border-gray-600',
                    ].join(' ')}>
                      {activeBusiness?.id === b.id && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    <span className={[
                      'truncate',
                      activeBusiness?.id === b.id
                        ? 'font-semibold text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300',
                    ].join(' ')}>
                      {b.name}
                    </span>
                  </button>
                  {/* Edit / Delete — visible on hover */}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mr-1">
                    <button
                      onClick={() => { setEditingId(b.id); setNameInput(b.name); setAdding(false) }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                      title={t.editBusiness}
                    >
                      <PencilIcon />
                    </button>
                    {businesses.length > 1 && (
                      <button
                        onClick={() => setDeleteConfirmId(b.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                        title={t.deleteBusiness}
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add business */}
          <div className="border-t border-gray-100 dark:border-gray-700">
            {adding ? (
              <form onSubmit={handleSubmit} className="flex items-center gap-1 px-2 py-1.5">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder={t.businessNamePlaceholder}
                  className="flex-1 min-w-0 text-sm rounded-lg px-2 py-1 border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded-lg transition shrink-0"
                >
                  {t.save}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-gray-500 dark:text-gray-400 px-1.5 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition shrink-0"
                >
                  {t.cancel}
                </button>
              </form>
            ) : (
              <button
                onClick={() => { setAdding(true); setEditingId(null); setNameInput('') }}
                className="w-full text-left text-sm text-indigo-600 dark:text-indigo-400 font-medium px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              >
                {t.addBusiness}
              </button>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-500 dark:text-red-400 px-3 pb-2 pt-1">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
