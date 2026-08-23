import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/client'
import { inativarProduto, listarProdutos } from '../api/produtos'
import { useAuth } from '../auth/AuthContext'
import type { Page, Produto } from '../types/produto'
import { getErrorMessage } from '../utils/validation'
import styles from './ProdutosPage.module.css'

/** Mínimo de caracteres para disparar busca no servidor (escala). */
const BUSCA_MIN_API = 3

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function formatPreco(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface ProdutoActionsProps {
  produto: Produto
  actionId: number | null
  onInativar: (produto: Produto) => void
  className?: string
}

function ProdutoActions({ produto, actionId, onInativar, className }: ProdutoActionsProps) {
  return (
    <div className={className ?? styles.rowActions}>
      <Link to={`/produtos/${produto.id}/editar`} className={styles.linkBtn}>
        Editar
      </Link>
      {produto.tipoProduto === 'PACOTE' && (
        <Link to={`/produtos/${produto.id}/kit`} className={styles.kitLink}>
          Kit
        </Link>
      )}
      {produto.ativo && (
        <button
          type="button"
          className={styles.dangerBtn}
          disabled={actionId === produto.id}
          onClick={() => onInativar(produto)}
        >
          {actionId === produto.id ? 'Inativando…' : 'Inativar'}
        </button>
      )}
    </div>
  )
}

function StatusBadge({ ativo }: { ativo: boolean }) {
  return (
    <span className={ativo ? styles.badgeActive : styles.badgeInactive}>
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  )
}

export function ProdutosPage() {
  const { session, logout } = useAuth()
  const [page, setPage] = useState<Page<Produto> | null>(null)
  const [pageNumber, setPageNumber] = useState(0)
  const [incluirInativos, setIncluirInativos] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<number | null>(null)
  const [nomeBusca, setNomeBusca] = useState('')
  const [nomeBuscaDebounced, setNomeBuscaDebounced] = useState('')
  const [codigoBarrasBusca, setCodigoBarrasBusca] = useState('')
  const [codigoBarrasDebounced, setCodigoBarrasDebounced] = useState('')
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
        incluirInativos,
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
  }, [session, pageNumber, incluirInativos, nomeBuscaDebounced, codigoBarrasDebounced, handleUnauthorized])

  useEffect(() => {
    void load()
  }, [load])

  async function handleInativar(produto: Produto) {
    if (!session || !produto.ativo) return

    const confirmed = window.confirm(
      `Inativar "${produto.nome}"?\n\nO produto permanece no histórico, mas deixa de aparecer no catálogo ativo.`,
    )
    if (!confirmed) return

    setActionId(produto.id)
    setLoadError(null)

    try {
      await inativarProduto(session.token, produto.id)
      await load()
    } catch (err) {
      if (handleUnauthorized(err)) return
      setLoadError(getErrorMessage(err, 'Não foi possível inativar o produto.'))
    } finally {
      setActionId(null)
    }
  }

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

  const buscaPorNomeAtiva = nomeBusca.trim().length > 0
  const buscaPorCodigoAtiva = onlyDigits(codigoBarrasBusca).length > 0
  const buscaAtiva = buscaPorNomeAtiva || buscaPorCodigoAtiva
  const buscaNomeCurta = buscaPorNomeAtiva && nomeBusca.trim().length < BUSCA_MIN_API
  const buscaCodigoCurta = buscaPorCodigoAtiva && onlyDigits(codigoBarrasBusca).length < BUSCA_MIN_API
  const buscaNoServidor =
    nomeBuscaDebounced.length >= BUSCA_MIN_API || codigoBarrasDebounced.length >= BUSCA_MIN_API
  const listaPronta = page !== null && !initialLoading

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Produtos</h1>
          <p className={styles.subtitle}>Catálogo do OmniCore</p>
        </div>
        <div className={styles.headerActions}>
          {page && (
            <span className={styles.count}>
              {page.totalElements} {page.totalElements === 1 ? 'item' : 'itens'}
            </span>
          )}
          <Link to="/produtos/novo" className={styles.newBtn}>
            + Novo produto
          </Link>
        </div>
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

      <label className={styles.filter}>
        <input
          type="checkbox"
          checked={incluirInativos}
          onChange={(e) => {
            setIncluirInativos(e.target.checked)
            setPageNumber(0)
          }}
        />
        Incluir produtos inativos
      </label>

      {initialLoading && <p className={styles.status}>Carregando…</p>}
      {loadError && <p className={styles.error}>{loadError}</p>}

      {listaPronta && !loadError && (
        <>
          {produtosExibidos.length === 0 ? (
            <p className={styles.status}>
              {buscaAtiva
                ? 'Nenhum produto encontrado para os filtros informados.'
                : 'Nenhum produto encontrado.'}
            </p>
          ) : (
            <>
              <div className={styles.cardList}>
                {produtosExibidos.map((produto) => (
                  <article
                    key={produto.id}
                    className={`${styles.card}${!produto.ativo ? ` ${styles.cardInactive}` : ''}`}
                  >
                    <div className={styles.cardTop}>
                      <h2 className={styles.cardTitle}>{produto.nome}</h2>
                      {incluirInativos && <StatusBadge ativo={produto.ativo} />}
                    </div>
                    <dl className={styles.cardMeta}>
                      <div>
                        <dt>Código</dt>
                        <dd className={styles.mono}>{produto.codigoBarras}</dd>
                      </div>
                      <div>
                        <dt>Preço</dt>
                        <dd className={styles.cardPreco}>{formatPreco(produto.precoVenda)}</dd>
                      </div>
                      <div>
                        <dt>Categoria</dt>
                        <dd>{produto.categoria}</dd>
                      </div>
                      <div>
                        <dt>Tipo</dt>
                        <dd>{produto.tipoProduto}</dd>
                      </div>
                    </dl>
                    <ProdutoActions
                      produto={produto}
                      actionId={actionId}
                      onInativar={(p) => void handleInativar(p)}
                      className={styles.cardActions}
                    />
                  </article>
                ))}
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nome</th>
                      <th>Categoria</th>
                      <th>Tipo</th>
                      <th>Preço</th>
                      {incluirInativos && <th>Status</th>}
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosExibidos.map((produto) => (
                      <tr
                        key={produto.id}
                        className={!produto.ativo ? styles.inactiveRow : undefined}
                      >
                        <td className={styles.mono}>{produto.codigoBarras}</td>
                        <td>{produto.nome}</td>
                        <td>{produto.categoria}</td>
                        <td>{produto.tipoProduto}</td>
                        <td className={styles.preco}>{formatPreco(produto.precoVenda)}</td>
                        {incluirInativos && (
                          <td>
                            <StatusBadge ativo={produto.ativo} />
                          </td>
                        )}
                        <td>
                          <ProdutoActions
                            produto={produto}
                            actionId={actionId}
                            onInativar={(p) => void handleInativar(p)}
                          />
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
                {page.totalElements === 1 ? 'item no total' : 'itens no total'}
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
