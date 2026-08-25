import { useCallback } from 'react'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'

/** Trata 401 deslogando o usuário. Retorna true se o erro foi 401. */
export function useUnauthorizedHandler() {
  const { logout } = useAuth()

  return useCallback((err: unknown): boolean => {
    if (err instanceof ApiError && err.status === 401) {
      logout()
      return true
    }
    return false
  }, [logout])
}
