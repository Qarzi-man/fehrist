import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { useBusinessStore } from '../store/businessStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`

  const businessId = useBusinessStore.getState().activeBusiness?.id
  if (businessId) config.headers['X-Business-Id'] = String(businessId)

  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(err)
  }
)

export default api
