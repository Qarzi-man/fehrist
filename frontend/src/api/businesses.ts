import api from './client'
import type { Business } from '../store/businessStore'

export async function getBusinesses(): Promise<Business[]> {
  const r = await api.get('/businesses')
  return r.data
}

export async function createBusiness(payload: { name: string }): Promise<Business> {
  const r = await api.post('/businesses', payload)
  return r.data
}

export async function updateBusiness(id: number, payload: { name: string }): Promise<Business> {
  const r = await api.put(`/businesses/${id}`, payload)
  return r.data
}

export async function deleteBusiness(id: number): Promise<void> {
  await api.delete(`/businesses/${id}`)
}
