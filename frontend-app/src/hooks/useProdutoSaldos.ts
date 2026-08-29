import { useCallback, useEffect, useState } from 'react'
import { obterSaldo, obterSaldoIndicador } from '../api/estoque'
import { useAuth } from '../auth/AuthContext'
import { useUnauthorizedHandler } from './useUnauthorizedHandler'

export type SaldoStatus =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'loaded'; saldo: number; referencia?: number }
  | { state: 'error' }

interface UseProdutoSaldosOptions {
  /** Busca pico histórico para cores por faixa (listagem Produtos). */
  comIndicador?: boolean
  /** Atualiza saldos automaticamente (ex.: tela Estoque aberta em outro terminal). */
  refetchIntervalMs?: number
}

export function useProdutoSaldos(produtoIds: number[], options: UseProdutoSaldosOptions = {}) {
  const { comIndicador = false, refetchIntervalMs } = options
  const { session } = useAuth()
  const handleUnauthorized = useUnauthorizedHandler()
  const [saldos, setSaldos] = useState<Record<number, SaldoStatus>>({})

  const idsKey = produtoIds.join(',')

  const fetchSaldos = useCallback(
    async (silent: boolean) => {
      if (!session || produtoIds.length === 0) return

      if (!silent) {
        setSaldos((prev) => {
          const next = { ...prev }
          for (const id of produtoIds) {
            next[id] = { state: 'loading' }
          }
          return next
        })
      }

      await Promise.all(
        produtoIds.map(async (id) => {
          try {
            if (comIndicador) {
              const indicador = await obterSaldoIndicador(session.token, id)
              setSaldos((prev) => ({
                ...prev,
                [id]: {
                  state: 'loaded',
                  saldo: indicador.saldo,
                  referencia: indicador.referencia,
                },
              }))
            } else {
              const saldo = await obterSaldo(session.token, id)
              setSaldos((prev) => ({ ...prev, [id]: { state: 'loaded', saldo } }))
            }
          } catch (err) {
            if (handleUnauthorized(err)) return
            if (!silent) {
              setSaldos((prev) => ({ ...prev, [id]: { state: 'error' } }))
            }
          }
        }),
      )
    },
    [session, produtoIds, comIndicador, handleUnauthorized],
  )

  useEffect(() => {
    if (!session || produtoIds.length === 0) return

    let cancelled = false

    void (async () => {
      if (cancelled) return
      await fetchSaldos(false)
    })()

    return () => {
      cancelled = true
    }
  }, [session, idsKey, produtoIds.length, fetchSaldos])

  useEffect(() => {
    if (!session || !refetchIntervalMs || produtoIds.length === 0) return

    const tick = () => {
      if (document.visibilityState === 'hidden') return
      void fetchSaldos(true)
    }

    const interval = window.setInterval(tick, refetchIntervalMs)
    return () => window.clearInterval(interval)
  }, [session, idsKey, refetchIntervalMs, fetchSaldos, produtoIds.length])

  function saldoFor(produtoId: number): SaldoStatus {
    return saldos[produtoId] ?? { state: 'loading' }
  }

  return { saldoFor }
}
