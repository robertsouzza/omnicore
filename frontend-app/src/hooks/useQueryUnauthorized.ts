import { useEffect } from 'react'
import { useUnauthorizedHandler } from './useUnauthorizedHandler'

/** Desloga em 401 quando uma query ou mutation falha. */
export function useQueryUnauthorized(error: unknown | null | undefined) {
  const handleUnauthorized = useUnauthorizedHandler()

  useEffect(() => {
    if (error) handleUnauthorized(error)
  }, [error, handleUnauthorized])
}
