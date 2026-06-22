import { useAuthStore } from '../store/authStore'
import { useBusinessStore } from '../store/businessStore'

export function useIsOwner(): boolean {
  const userId = useAuthStore((s) => s.user?.id)
  const ownerId = useBusinessStore((s) => s.activeBusiness?.owner_id)
  if (!ownerId) return true
  return ownerId === userId
}
