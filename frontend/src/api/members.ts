import api from './client'

export interface Member {
  id: number
  role: 'employee'
  status: 'pending' | 'active'
  full_name: string | null
  phone: string | null
  created_at: string
}

export interface PendingInvite {
  id: number
  business_id: number
  business_name: string
  invited_by_name: string | null
  role: 'employee'
  status: 'pending'
  created_at: string
}

export async function getMembers(): Promise<Member[]> {
  const { data } = await api.get<Member[]>('/business/members')
  return data
}

export async function getPendingInvites(): Promise<PendingInvite[]> {
  const { data } = await api.get<PendingInvite[]>('/business/members/pending')
  return data
}

export async function inviteMember(phone: string): Promise<Member> {
  const { data } = await api.post<Member>('/business/members/invite', { phone })
  return data
}

export async function acceptInvite(id: number): Promise<void> {
  await api.post('/business/members/accept', { id })
}

export async function declineInvite(id: number): Promise<void> {
  await api.post('/business/members/decline', { id })
}

export async function removeMember(id: number): Promise<void> {
  await api.delete(`/business/members/${id}`)
}
