import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { SaldoCell, SaldoKitPlaceholder } from '../components/SaldoCell'
import { useDebouncedSearch, useProdutoSaldos, useQueryUnauthorized } from '../hooks'
import {
  getInativarProdutoErrorMessage,
  getProdutosQueryErrorMessage,
  useInativarProdutoMutation,
  useProdutosListQuery,
} from '../queries/produtos'
import type { Produto } from '../types/produto'
import { onlyDigits } from '../utils/strings'
import styles from './ProdutosPage.module.css'

/** Mínimo de caracteres para disparar busca no servidor (escala). */
const BUSCA_MIN_API = 3

function formatPreco(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

import { resolveImagemUrl } from '../utils/produtoImagem'

interface ProdutoThumbnailProps {
  produto: Produto
  onPreview?: (produto: Produto) => void
}

function ProdutoThumbnail({ produto, onPreview }: ProdutoThumbnailProps) {
  const [failed, setFailed] = useState(false)
  const src = resolveImagemUrl(produto.urlImagem)
  const canPreview = Boolean(src && !failed && onPreview)

  const image = (
    <img
      className={styles.thumb}
      src={src ?? undefined}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )

  if (!src || failed) {
    return (
      <div className={styles.thumbPlaceholder} aria-hidden="true">
        <span>{produto.nome.charAt(0).toUpperCase()}</span>
      </div>
    )
  }

  if (!canPreview) {
    return image
  }

  return (
    <button
      type="button"
      className={styles.thumbBtn}
      aria-label={`Ampliar imagem de ${produto.nome}`}
      onClick={() => onPreview?.(produto)}
    >
      {image}
    </button>
  )
}

function ProdutoImagemLightbox({
  produto,
  onClose,
}: {
  produto: Produto
  onClose: () => void
}) {
  const [failed, setFailed] = useState(false)
  const src = resolveImagemUrl(produto.urlImagem)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  if (!src || failed) {
    return null
  }

  return (
    <div
      className={styles.lightboxOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={`Visualização ampliada: ${produto.nome}`}
      onClick={onClose}
    >
      <div className={styles.lightboxPanel} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.lightboxClose}
          aria-label="Fechar visualização"
          onClick={onClose}
        >
          ×
        </button>
        <img
          className={styles.lightboxImage}
          src={src}
          alt={produto.nome}
          onError={() => setFailed(true)}
        />
        <p className={styles.lightboxCaption}>{produto.nome}</p>
      </div>
    </div>
  )
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
  const { session } = useAuth()
  const [pageNumber, setPageNumber] = useState(0)
  const [incluirInativos, setIncluirInativos] = useState(false)
  const [previewProduto, setPreviewProduto] = useState<Produto | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

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

  const listFilters = useMemo(
    () => ({
      page: pageNumber,
      incluirInativos,
      nome: nomeSearch.debouncedValue || undefined,
      codigoBarras: codigoSearch.debouncedValue || undefined,
    }),
    [pageNumber, incluirInativos, nomeSearch.debouncedValue, codigoSearch.debouncedValue],
  )

  const produtosQuery = useProdutosListQuery(session?.token, listFilters)
  useQueryUnauthorized(produtosQuery.error)

  const inativarMutation = useInativarProdutoMutation(session?.token)
  useQueryUnauthorized(inativarMutation.error)

  const page = produtosQuery.data ?? null
  const initialLoading = produtosQuery.isPending
  const refreshing = produtosQuery.isFetching && !produtosQuery.isPending
  const loadError = produtosQuery.error
    ? getProdutosQueryErrorMessage(produtosQuery.error)
    : actionError
  const listaPronta = produtosQuery.isSuccess
  const actionId = inativarMutation.isPending ? (inativarMutation.variables ?? null) : null

  async function handleInativar(produto: Produto) {
    if (!session || !produto.ativo) return

    const confirmed = window.confirm(
      `Inativar "${produto.nome}"?\n\nO produto permanece no histórico, mas deixa de aparecer no catálogo ativo.`,
    )
    if (!confirmed) return

    setActionError(null)
    try {
      await inativarMutation.mutateAsync(produto.id)
    } catch (err) {
      setActionError(getInativarProdutoErrorMessage(err))
    }
  }

  const produtosExibidos = useMemo(() => {
    const termoNome = nomeSearch.normalized.toLowerCase()
    const termoCodigo = codigoSearch.normalized
    const base = page?.content ?? []

    return base.filter((produto) => {
      const matchNome = !termoNome || produto.nome.toLowerCase().includes(termoNome)
      const matchCodigo = !termoCodigo || produto.codigoBarras.includes(termoCodigo)
      return matchNome && matchCodigo
    })
  }, [page, nomeSearch.normalized, codigoSearch.normalized])

  const unitarioIds = useMemo(
    () => produtosExibidos.filter((p) => p.tipoProduto === 'UNITARIO').map((p) => p.id),
    [produtosExibidos],
  )
  const { saldoFor } = useProdutoSaldos(unitarioIds, {
    comIndicador: true,
    refetchIntervalMs: 4000,
  })

  function estoqueCell(produto: Produto) {
    if (produto.tipoProduto !== 'UNITARIO') {
      return <SaldoKitPlaceholder />
    }
    return <SaldoCell status={saldoFor(produto.id)} indicador />
  }

  const buscaAtiva = nomeSearch.isActive || codigoSearch.isActive
  const buscaNoServidor = nomeSearch.isServerSearch || codigoSearch.isServerSearch

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
              {page.totalElements} {page.totalElements === 1 ? 'item' : 'itens'} · atualiza a
              cada 4s
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
                    <div className={styles.cardHeader}>
                      <ProdutoThumbnail produto={produto} onPreview={setPreviewProduto} />
                      <div className={styles.cardTop}>
                        <h2 className={styles.cardTitle}>{produto.nome}</h2>
                        {incluirInativos && <StatusBadge ativo={produto.ativo} />}
                      </div>
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
                        <dt>Estoque</dt>
                        <dd>{estoqueCell(produto)}</dd>
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
                      <th className={styles.thCol}>Imagem</th>
                      <th>Código</th>
                      <th>Nome</th>
                      <th>Categoria</th>
                      <th>Tipo</th>
                      <th>Preço</th>
                      <th className={styles.saldoCol}>Estoque</th>
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
                        <td className={styles.thCol}>
                          <ProdutoThumbnail produto={produto} onPreview={setPreviewProduto} />
                        </td>
                        <td className={styles.mono}>{produto.codigoBarras}</td>
                        <td>{produto.nome}</td>
                        <td>{produto.categoria}</td>
                        <td>{produto.tipoProduto}</td>
                        <td className={styles.preco}>{formatPreco(produto.precoVenda)}</td>
                        <td className={styles.saldoCol}>{estoqueCell(produto)}</td>
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

      {previewProduto && (
        <ProdutoImagemLightbox produto={previewProduto} onClose={() => setPreviewProduto(null)} />
      )}
    </section>
  )
}
