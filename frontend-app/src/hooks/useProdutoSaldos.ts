import { useEffect, useState } from 'react'
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
}

export function useProdutoSaldos(produtoIds: number[], options: UseProdutoSaldosOptions = {}) {
  const { comIndicador = false } = options
  const { session } = useAuth()
  const handleUnauthorized = useUnauthorizedHandler()
  const [saldos, setSaldos] = useState<Record<number, SaldoStatus>>({})

  const idsKey = produtoIds.join(',')

  useEffect(() => {
    if (!session || produtoIds.length === 0) return

    setSaldos((prev) => {
      const next = { ...prev }
      for (const id of produtoIds) {
        next[id] = { state: 'loading' }
      }
      return next
    })

    let cancelled = false

    void (async () => {
      await Promise.all(
        produtoIds.map(async (id) => {
          try {
            if (comIndicador) {
              const indicador = await obterSaldoIndicador(session.token, id)
              if (!cancelled) {
                setSaldos((prev) => ({
                  ...prev,
                  [id]: {
                    state: 'loaded',
                    saldo: indicador.saldo,
                    referencia: indicador.referencia,
                  },
                }))
              }
            } else {
              const saldo = await obterSaldo(session.token, id)
              if (!cancelled) {
                setSaldos((prev) => ({ ...prev, [id]: { state: 'loaded', saldo } }))
              }
            }
          } catch (err) {
            if (handleUnauthorized(err)) return
            if (!cancelled) {
              setSaldos((prev) => ({ ...prev, [id]: { state: 'error' } }))
            }
          }
        }),
      )
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, idsKey, comIndicador, handleUnauthorized])

  function saldoFor(produtoId: number): SaldoStatus {
    return saldos[produtoId] ?? { state: 'loading' }
  }

  return { saldoFor }
}
