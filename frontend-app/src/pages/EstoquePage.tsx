import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/client'
import { obterSaldo } from '../api/estoque'
import { listarProdutos } from '../api/produtos'
import { useAuth } from '../auth/AuthContext'
import type { Page, Produto } from '../types/produto'
import { getErrorMessage } from '../utils/validation'
import styles from './EstoquePage.module.css'

const BUSCA_MIN_API = 3

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

type SaldoStatus =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'loaded'; saldo: number }
  | { state: 'error' }

function SaldoCell({ status }: { status: SaldoStatus }) {
  if (status.state === 'loading') {
    return <span className={styles.saldoLoading}>…</span>
  }
  if (status.state === 'error') {
    return <span className={styles.saldoError}>—</span>
  }
  if (status.state === 'loaded') {
    return (
      <span className={status.saldo === 0 ? styles.saldoZero : styles.saldoValue}>
        {status.saldo}
      </span>
    )
  }
  return <span className={styles.saldoLoading}>…</span>
}

export function EstoquePage() {
  const { session, logout } = useAuth()
  const [page, setPage] = useState<Page<Produto> | null>(null)
  const [pageNumber, setPageNumber] = useState(0)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [nomeBusca, setNomeBusca] = useState('')
  const [nomeBuscaDebounced, setNomeBuscaDebounced] = useState('')
  const [codigoBarrasBusca, setCodigoBarrasBusca] = useState('')
  const [codigoBarrasDebounced, setCodigoBarrasDebounced] = useState('')
  const [saldos, setSaldos] = useState<Record<number, SaldoStatus>>({})
  const hasLoadedOnce = useRef(false)

  const handleUnauthorized = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        return true
      }
      return false
    },
    [logout],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const termo = nomeBusca.trim()
      setNomeBuscaDebounced(termo.length >= BUSCA_MIN_API ? termo : '')
      setPageNumber(0)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [nomeBusca])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const digits = onlyDigits(codigoBarrasBusca)
      setCodigoBarrasDebounced(digits.length >= BUSCA_MIN_API ? digits : '')
      setPageNumber(0)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [codigoBarrasBusca])

  const load = useCallback(async () => {
    if (!session) return

    if (!hasLoadedOnce.current) {
      setInitialLoading(true)
    } else {
      setRefreshing(true)
    }
    setLoadError(null)

    try {
      const data = await listarProdutos(session.token, {
        page: pageNumber,
        nome: nomeBuscaDebounced || undefined,
        codigoBarras: codigoBarrasDebounced || undefined,
      })
      setPage(data)
    } catch (err) {
      if (handleUnauthorized(err)) return
      setLoadError(getErrorMessage(err, 'Erro ao carregar produtos.'))
    } finally {
      hasLoadedOnce.current = true
      setInitialLoading(false)
      setRefreshing(false)
    }
  }, [session, pageNumber, nomeBuscaDebounced, codigoBarrasDebounced, handleUnauthorized])

  useEffect(() => {
    void load()
  }, [load])

  const produtosExibidos = useMemo(() => {
    const termoNome = nomeBusca.trim().toLowerCase()
    const termoCodigo = onlyDigits(codigoBarrasBusca)
    const base = page?.content ?? []

    return base.filter((produto) => {
      const matchNome = !termoNome || produto.nome.toLowerCase().includes(termoNome)
      const matchCodigo = !termoCodigo || produto.codigoBarras.includes(termoCodigo)
      return matchNome && matchCodigo
    })
  }, [page, nomeBusca, codigoBarrasBusca])

  useEffect(() => {
    if (!session || produtosExibidos.length === 0) return

    const produtoIds = produtosExibidos.map((p) => p.id)
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
            const saldo = await obterSaldo(session.token, id)
            if (!cancelled) {
              setSaldos((prev) => ({ ...prev, [id]: { state: 'loaded', saldo } }))
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
  }, [session, produtosExibidos, handleUnauthorized])

  const buscaPorNomeAtiva = nomeBusca.trim().length > 0
  const buscaPorCodigoAtiva = onlyDigits(codigoBarrasBusca).length > 0
  const buscaAtiva = buscaPorNomeAtiva || buscaPorCodigoAtiva
  const buscaNomeCurta = buscaPorNomeAtiva && nomeBusca.trim().length < BUSCA_MIN_API
  const buscaCodigoCurta = buscaPorCodigoAtiva && onlyDigits(codigoBarrasBusca).length < BUSCA_MIN_API
  const buscaNoServidor =
    nomeBuscaDebounced.length >= BUSCA_MIN_API || codigoBarrasDebounced.length >= BUSCA_MIN_API
  const listaPronta = page !== null && !initialLoading

  function saldoFor(produtoId: number): SaldoStatus {
    return saldos[produtoId] ?? { state: 'loading' }
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Estoque</h1>
          <p className={styles.subtitle}>
            Consulte saldos e registre entradas ou saídas por produto
          </p>
        </div>
        {page && (
          <span className={styles.count}>
            {page.totalElements} {page.totalElements === 1 ? 'produto' : 'produtos'}
          </span>
        )}
      </div>

      <div className={styles.searchPanel}>
        <label className={styles.searchLabelNome}>
          Buscar por produto
          <input
            className={styles.searchInputNome}
            value={nomeBusca}
            onChange={(e) => setNomeBusca(e.target.value)}
            placeholder="Digite parte do nome"
            autoComplete="off"
          />
        </label>

        <label className={styles.searchLabelCodigo}>
          Código de barras
          <input
            className={styles.searchInputCodigo}
            value={codigoBarrasBusca}
            onChange={(e) => setCodigoBarrasBusca(onlyDigits(e.target.value))}
            placeholder="Digite o código (EAN)"
            inputMode="numeric"
            autoComplete="off"
          />
        </label>

        {(buscaNomeCurta || buscaCodigoCurta) && (
          <span className={styles.searchHint}>
            Filtrando na página atual — informe {BUSCA_MIN_API} ou mais caracteres para buscar no
            servidor.
          </span>
        )}
        {refreshing && buscaNoServidor && (
          <span className={styles.searchHint}>Buscando no servidor…</span>
        )}
      </div>

      {initialLoading && <p className={styles.status}>Carregando…</p>}
      {loadError && <p className={styles.error}>{loadError}</p>}

      {listaPronta && !loadError && (
        <>
          {produtosExibidos.length === 0 ? (
            <p className={styles.status}>
              {buscaAtiva
                ? 'Nenhum produto encontrado para os filtros informados.'
                : 'Nenhum produto ativo encontrado.'}
            </p>
          ) : (
            <>
              <div className={styles.cardList}>
                {produtosExibidos.map((produto) => (
                  <article key={produto.id} className={styles.card}>
                    <div className={styles.cardTop}>
                      <h2 className={styles.cardTitle}>{produto.nome}</h2>
                      <SaldoCell status={saldoFor(produto.id)} />
                    </div>
                    <dl className={styles.cardMeta}>
                      <div>
                        <dt>Código</dt>
                        <dd className={styles.mono}>{produto.codigoBarras}</dd>
                      </div>
                      <div>
                        <dt>Categoria</dt>
                        <dd>{produto.categoria}</dd>
                      </div>
                    </dl>
                    <Link to={`/estoque/${produto.id}`} className={styles.manageBtn}>
                      Movimentar estoque
                    </Link>
                  </article>
                ))}
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Produto</th>
                      <th>Categoria</th>
                      <th>Saldo</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosExibidos.map((produto) => (
                      <tr key={produto.id}>
                        <td className={styles.mono}>{produto.codigoBarras}</td>
                        <td>{produto.nome}</td>
                        <td>{produto.categoria}</td>
                        <td>
                          <SaldoCell status={saldoFor(produto.id)} />
                        </td>
                        <td>
                          <Link to={`/estoque/${produto.id}`} className={styles.linkBtn}>
                            Movimentar
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {page && (
            <div className={styles.pagination}>
              {page.totalPages > 1 && (
                <button
                  type="button"
                  disabled={page.first}
                  onClick={() => setPageNumber((n) => n - 1)}
                >
                  Anterior
                </button>
              )}
              <span className={styles.paginationInfo}>
                Página {page.number + 1} de {page.totalPages}
                {' · '}
                {page.totalElements}{' '}
                {page.totalElements === 1 ? 'produto no total' : 'produtos no total'}
              </span>
              {page.totalPages > 1 && (
                <button
                  type="button"
                  disabled={page.last}
                  onClick={() => setPageNumber((n) => n + 1)}
                >
                  Próxima
                </button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}
