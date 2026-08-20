import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/client'
import { inativarProduto, listarProdutos } from '../api/produtos'
import { useAuth } from '../auth/AuthContext'
import type { Page, Produto } from '../types/produto'
import { getErrorMessage } from '../utils/validation'
import styles from './ProdutosPage.module.css'

function formatPreco(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ProdutosPage() {
  const { session, logout } = useAuth()
  const [page, setPage] = useState<Page<Produto> | null>(null)
  const [pageNumber, setPageNumber] = useState(0)
  const [incluirInativos, setIncluirInativos] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<number | null>(null)

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

  const load = useCallback(async () => {
    if (!session) return

    setLoading(true)
    setError(null)

    try {
      const data = await listarProdutos(session.token, {
        page: pageNumber,
        incluirInativos,
      })
      setPage(data)
    } catch (err) {
      if (handleUnauthorized(err)) return
      setError(getErrorMessage(err, 'Erro ao carregar produtos.'))
    } finally {
      setLoading(false)
    }
  }, [session, pageNumber, incluirInativos, handleUnauthorized])

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
    setError(null)

    try {
      await inativarProduto(session.token, produto.id)
      await load()
    } catch (err) {
      if (handleUnauthorized(err)) return
      setError(getErrorMessage(err, 'Não foi possível inativar o produto.'))
    } finally {
      setActionId(null)
    }
  }

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

      {loading && <p className={styles.status}>Carregando…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && page && (
        <>
          {page.empty ? (
            <p className={styles.status}>Nenhum produto encontrado.</p>
          ) : (
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
                  {page.content.map((produto) => (
                    <tr key={produto.id} className={!produto.ativo ? styles.inactiveRow : undefined}>
                      <td className={styles.mono}>{produto.codigoBarras}</td>
                      <td>{produto.nome}</td>
                      <td>{produto.categoria}</td>
                      <td>{produto.tipoProduto}</td>
                      <td className={styles.preco}>{formatPreco(produto.precoVenda)}</td>
                      {incluirInativos && (
                        <td>
                          <span
                            className={
                              produto.ativo ? styles.badgeActive : styles.badgeInactive
                            }
                          >
                            {produto.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                      )}
                      <td>
                        <div className={styles.rowActions}>
                          <Link to={`/produtos/${produto.id}/editar`} className={styles.linkBtn}>
                            Editar
                          </Link>
                          {produto.ativo && (
                            <button
                              type="button"
                              className={styles.dangerBtn}
                              disabled={actionId === produto.id}
                              onClick={() => void handleInativar(produto)}
                            >
                              {actionId === produto.id ? 'Inativando…' : 'Inativar'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {page.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                disabled={page.first}
                onClick={() => setPageNumber((n) => n - 1)}
              >
                Anterior
              </button>
              <span>
                Página {page.number + 1} de {page.totalPages}
              </span>
              <button
                type="button"
                disabled={page.last}
                onClick={() => setPageNumber((n) => n + 1)}
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
