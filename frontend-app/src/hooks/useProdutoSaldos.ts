import { useCallback, useEffect, useState } from 'react'
import { obterSaldo, obterSaldoIndicador, obterSaldosIndicadorLote } from '../api/estoque'
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

      const aplicarIndicadores = (itens: { produtoId: number; saldo: number; referencia: number }[]) => {
        const porId = new Map(itens.map((item) => [item.produtoId, item]))
        setSaldos((prev) => {
          const next = { ...prev }
          for (const id of produtoIds) {
            const item = porId.get(id)
            if (item) {
              next[id] = {
                state: 'loaded',
                saldo: item.saldo,
                referencia: item.referencia,
              }
            } else if (!silent) {
              next[id] = { state: 'error' }
            }
          }
          return next
        })
      }

      try {
        if (comIndicador) {
          try {
            const itens = await obterSaldosIndicadorLote(session.token, produtoIds)
            aplicarIndicadores(itens)
          } catch (batchErr) {
            if (handleUnauthorized(batchErr)) return
            await Promise.all(
              produtoIds.map(async (id) => {
                try {
                  const indicador = await obterSaldoIndicador(session.token, id)
                  setSaldos((prev) => ({
                    ...prev,
                    [id]: {
                      state: 'loaded',
                      saldo: indicador.saldo,
                      referencia: indicador.referencia,
                    },
                  }))
                } catch (err) {
                  if (handleUnauthorized(err)) return
                  if (!silent) {
                    setSaldos((prev) => ({ ...prev, [id]: { state: 'error' } }))
                  }
                }
              }),
            )
          }
        } else {
          await Promise.all(
            produtoIds.map(async (id) => {
              try {
                const saldo = await obterSaldo(session.token, id)
                setSaldos((prev) => ({ ...prev, [id]: { state: 'loaded', saldo } }))
              } catch (err) {
                if (handleUnauthorized(err)) return
                if (!silent) {
                  setSaldos((prev) => ({ ...prev, [id]: { state: 'error' } }))
                }
              }
            }),
          )
        }
      } catch (err) {
        if (handleUnauthorized(err)) return
        if (!silent) {
          setSaldos((prev) => {
            const next = { ...prev }
            for (const id of produtoIds) {
              next[id] = { state: 'error' }
            }
            return next
          })
        }
      }
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
