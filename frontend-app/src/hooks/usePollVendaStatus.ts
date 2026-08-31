import { useCallback, useEffect, useState } from 'react'
import { buscarVenda } from '../api/vendas'
import type { Venda } from '../types/venda'

export function usePollVendaStatus(
  token: string | undefined,
  vendaId: number | undefined,
  enabled: boolean,
  onUpdate: (venda: Venda) => void,
  intervalMs = 3000,
) {
  const [atualizando, setAtualizando] = useState(false)

  const atualizar = useCallback(async () => {
    if (!token || vendaId == null) return
    setAtualizando(true)
    try {
      const venda = await buscarVenda(token, vendaId)
      onUpdate(venda)
    } finally {
      setAtualizando(false)
    }
  }, [token, vendaId, onUpdate])

  useEffect(() => {
    if (!enabled || !token || vendaId == null) return
    const id = window.setInterval(() => void atualizar(), intervalMs)
    return () => window.clearInterval(id)
  }, [enabled, token, vendaId, atualizar, intervalMs])

  return { atualizar, atualizando }
}
