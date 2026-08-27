import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarProdutos } from '../api/produtos'
import { SaldoCell } from '../components/SaldoCell'
import {
  PageHeader,
  PaginationBar,
  SearchPanel,
  StatusMessage,
  TextField,
} from '../components/ui'
import { useAuth } from '../auth/AuthContext'
import { useDebouncedSearch, usePaginatedResource, useProdutoSaldos } from '../hooks'
import { onlyDigits } from '../utils/strings'
import styles from './EstoquePage.module.css'

const BUSCA_MIN_API = 3

export function EstoquePage() {
  const { session } = useAuth()
  const [pageNumber, setPageNumber] = useState(0)

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

  const produtoIds = useMemo(() => produtosExibidos.map((p) => p.id), [produtosExibidos])
  const { saldoFor } = useProdutoSaldos(produtoIds, { comIndicador: true })

  const buscaAtiva = nomeSearch.isActive || codigoSearch.isActive
  const buscaNoServidor = nomeSearch.isServerSearch || codigoSearch.isServerSearch

  const searchHints = (
    <>
      {(nomeSearch.isShort || codigoSearch.isShort) && (
        <StatusMessage variant="hint">
          Filtrando na página atual — informe {BUSCA_MIN_API} ou mais caracteres para buscar no
          servidor.
        </StatusMessage>
      )}
      {refreshing && buscaNoServidor && (
        <StatusMessage variant="hint">Buscando no servidor…</StatusMessage>
      )}
    </>
  )

  return (
    <section className={styles.page}>
      <PageHeader
        title="Estoque"
        subtitle="Movimentação de produtos unitários. Kits (pacotes) usam o estoque dos componentes — configure em Produtos → Kit."
        badge={
          page
            ? `${produtosExibidos.length} unitário${produtosExibidos.length === 1 ? '' : 's'} na página`
            : undefined
        }
      />

      <SearchPanel footer={searchHints}>
        <TextField
          label="Buscar por produto"
          value={nomeSearch.value}
          onChange={(e) => nomeSearch.setValue(e.target.value)}
          placeholder="Digite parte do nome"
          autoComplete="off"
        />
        <TextField
          label="Código de barras"
          mono
          value={codigoSearch.value}
          onChange={(e) => codigoSearch.setValue(onlyDigits(e.target.value))}
          placeholder="Digite o código (EAN)"
          inputMode="numeric"
          autoComplete="off"
        />
      </SearchPanel>

      {initialLoading && <StatusMessage>Carregando…</StatusMessage>}
      {loadError && <StatusMessage variant="error">{loadError}</StatusMessage>}

      {listaPronta && !loadError && (
        <>
          {produtosExibidos.length === 0 ? (
            <StatusMessage>
              {buscaAtiva
                ? 'Nenhum produto unitário encontrado para os filtros informados.'
                : 'Nenhum produto unitário ativo encontrado.'}
            </StatusMessage>
          ) : (
            <>
              <div className={styles.cardList}>
                {produtosExibidos.map((produto) => (
                  <article key={produto.id} className={styles.card}>
                    <div className={styles.cardTop}>
                      <h2 className={styles.cardTitle}>{produto.nome}</h2>
                      <SaldoCell status={saldoFor(produto.id)} indicador />
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
                      <th className={styles.saldoCol}>Saldo</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosExibidos.map((produto) => (
                      <tr key={produto.id}>
                        <td className={styles.mono}>{produto.codigoBarras}</td>
                        <td>{produto.nome}</td>
                        <td>{produto.categoria}</td>
                        <td className={styles.saldoCol}>
                          <SaldoCell status={saldoFor(produto.id)} indicador />
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
            <PaginationBar
              pageNumber={page.number}
              totalPages={page.totalPages}
              totalElements={page.totalElements}
              itemLabel={{ one: 'produto no total', many: 'produtos no total' }}
              first={page.first}
              last={page.last}
              onPrevious={() => setPageNumber((n) => n - 1)}
              onNext={() => setPageNumber((n) => n + 1)}
            />
          )}
        </>
      )}
    </section>
  )
}
