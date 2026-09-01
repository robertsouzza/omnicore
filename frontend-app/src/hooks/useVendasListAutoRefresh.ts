import { useEffect } from 'react'
import { escutarVendasAtualizadas } from '../utils/vendasSync'

const POLL_MS = 8_000

/**
 * Recarrega a listagem quando outra tela registra venda (PDV, caixa…),
 * ao voltar foco na aba ou em polling leve enquanto a página está visível.
 */
export function useVendasListAutoRefresh(
  enabled: boolean,
  onRefresh: () => void | Promise<void>,
): void {
  useEffect(() => {
    if (!enabled) return

    const refresh = () => {
      void onRefresh()
    }

    const unsubscribe = escutarVendasAtualizadas(refresh)

    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)

    const pollId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }, POLL_MS)

    return () => {
      unsubscribe()
      window.removeEventListener('focus', onFocus)
      window.clearInterval(pollId)
    }
  }, [enabled, onRefresh])
}
