import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { obterSaldo } from '../api/estoque'
import { listarProdutos } from '../api/produtos'
import { useAuth } from '../auth/AuthContext'
import { useDebouncedSearch, usePaginatedResource, useUnauthorizedHandler } from '../hooks'
import { onlyDigits } from '../utils/strings'
import styles from './EstoquePage.module.css'

const BUSCA_MIN_API = 3

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
  const { session } = useAuth()
  const [pageNumber, setPageNumber] = useState(0)
  const [saldos, setSaldos] = useState<Record<number, SaldoStatus>>({})
  const handleUnauthorized = useUnauthorizedHandler()

  const resetPage = useCallback(() => setPageNumber(0), [])

  const nomeSearch = useDebouncedSearch({
    minLength: BUSCA_MIN_API,
    onDebouncedChange: resetPage,
  })
  const codigoSearch = useDebouncedSearch({
    minLength: BUSCA_MIN_API,
    normalize: onlyDigits,
    onDebouncedChange: resetPage,
  })

  const fetchPage = useCallback(
    (page: number) => {
      if (!session) throw new Error('Sem sessão')
      return listarProdutos(session.token, {
        page,
        nome: nomeSearch.debouncedValue || undefined,
        codigoBarras: codigoSearch.debouncedValue || undefined,
      })
    },
    [session, nomeSearch.debouncedValue, codigoSearch.debouncedValue],
  )

  const {
    page,
    initialLoading,
    refreshing,
    loadError,
    listaPronta,
  } = usePaginatedResource(fetchPage, {
    enabled: !!session,
    errorMessage: 'Erro ao carregar produtos.',
    pageNumber,
    setPageNumber,
  })

  const produtosExibidos = useMemo(() => {
    const termoNome = nomeSearch.normalized.toLowerCase()
    const termoCodigo = codigoSearch.normalized
    const base = page?.content ?? []

    return base.filter((produto) => {
      if (produto.tipoProduto !== 'UNITARIO') return false
      const matchNome = !termoNome || produto.nome.toLowerCase().includes(termoNome)
      const matchCodigo = !termoCodigo || produto.codigoBarras.includes(termoCodigo)
      return matchNome && matchCodigo
    })
  }, [page, nomeSearch.normalized, codigoSearch.normalized])

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

  const buscaAtiva = nomeSearch.isActive || codigoSearch.isActive
  const buscaNoServidor = nomeSearch.isServerSearch || codigoSearch.isServerSearch

  function saldoFor(produtoId: number): SaldoStatus {
    return saldos[produtoId] ?? { state: 'loading' }
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Estoque</h1>
          <p className={styles.subtitle}>
            Movimentação de produtos unitários. Kits (pacotes) usam o estoque dos componentes —
            configure em Produtos → Kit.
          </p>
        </div>
          {page && (
            <span className={styles.count}>
              {produtosExibidos.length} unitário{produtosExibidos.length === 1 ? '' : 's'} na página
            </span>
          )}
      </div>

      <div className={styles.searchPanel}>
        <label className={styles.searchLabelNome}>
          Buscar por produto
          <input
            className={styles.searchInputNome}
            value={nomeSearch.value}
            onChange={(e) => nomeSearch.setValue(e.target.value)}
            placeholder="Digite parte do nome"
            autoComplete="off"
          />
        </label>

        <label className={styles.searchLabelCodigo}>
          Código de barras
          <input
            className={styles.searchInputCodigo}
            value={codigoSearch.value}
            onChange={(e) => codigoSearch.setValue(onlyDigits(e.target.value))}
            placeholder="Digite o código (EAN)"
            inputMode="numeric"
            autoComplete="off"
          />
        </label>

        {(nomeSearch.isShort || codigoSearch.isShort) && (
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
                ? 'Nenhum produto unitário encontrado para os filtros informados.'
                : 'Nenhum produto unitário ativo encontrado.'}
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
