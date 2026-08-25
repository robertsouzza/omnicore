import { useCallback, useState } from 'react'
import { getErrorMessage } from '../utils/validation'
import { useUnauthorizedHandler } from './useUnauthorizedHandler'

/**
 * Executa ações assíncronas (inativar, cancelar, submit) com id da linha em loading.
 */
export function useAsyncAction() {
  const handleUnauthorized = useUnauthorizedHandler()
  const [actionKey, setActionKey] = useState<string | number | null>(null)

  const execute = useCallback(
    async <T>(
      key: string | number | null,
      fn: () => Promise<T>,
      onError: (message: string) => void,
      fallbackMessage = 'Erro na operação.',
    ): Promise<T | undefined> => {
      if (key != null) setActionKey(key)

      try {
        return await fn()
      } catch (err) {
        if (handleUnauthorized(err)) return undefined
        onError(getErrorMessage(err, fallbackMessage))
        return undefined
      } finally {
        setActionKey(null)
      }
    },
    [handleUnauthorized],
  )

  return { actionKey, execute, handleUnauthorized }
}
