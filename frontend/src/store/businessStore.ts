import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Business {
  id: number
  owner_id: number
  name: string
  logo?: string | null
  created_at: string
  my_role?: 'owner' | 'employee'
}

interface BusinessState {
  activeBusiness: Business | null
  setActiveBusiness: (b: Business) => void
  clearBusiness: () => void
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set) => ({
      activeBusiness: null,
      setActiveBusiness: (b) => set({ activeBusiness: b }),
      clearBusiness: () => set({ activeBusiness: null }),
    }),
    { name: 'daftarcha-business' }
  )
)
