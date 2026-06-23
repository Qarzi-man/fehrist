import api from './client'

export interface UserProfile {
  id: number
  phone: string
  full_name: string | null
  avatar: string | null
}

export async function getProfile(): Promise<UserProfile> {
  const r = await api.get('/profile')
  return r.data
}

export async function updateProfile(payload: { full_name?: string; avatar?: string | null }): Promise<UserProfile> {
  const r = await api.patch('/profile', payload)
  return r.data
}

export async function deleteAccount(): Promise<void> {
  await api.delete('/profile')
}
