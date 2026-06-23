import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  phone: string
  full_name: string | null
  avatar?: string | null
  is_admin?: boolean
}

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  updateUser: (updates: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (updates) => set((s) => ({ user: s.user ? { ...s.user, ...updates } : s.user })),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'daftarcha-auth' }
  )
)
