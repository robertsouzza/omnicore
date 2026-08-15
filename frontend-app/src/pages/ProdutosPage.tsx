import { useCallback, useEffect, useState } from 'react'
import { listarProdutos } from '../api/produtos'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { Page, Produto } from '../types/produto'
import styles from './ProdutosPage.module.css'

function formatPreco(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ProdutosPage() {
  const { session, logout } = useAuth()
  const [page, setPage] = useState<Page<Produto> | null>(null)
  const [pageNumber, setPageNumber] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!session) return

    setLoading(true)
    setError(null)

    try {
      const data = await listarProdutos(session.token, { page: pageNumber })
      setPage(data)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        return
      }
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos.')
    } finally {
      setLoading(false)
    }
  }, [session, pageNumber, logout])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Produtos</h1>
          <p className={styles.subtitle}>Catálogo ativo do OmniCore</p>
        </div>
        {page && (
          <span className={styles.count}>
            {page.totalElements} {page.totalElements === 1 ? 'item' : 'itens'}
          </span>
        )}
      </div>

      {loading && <p className={styles.status}>Carregando…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && page && (
        <>
          {page.empty ? (
            <p className={styles.status}>Nenhum produto cadastrado.</p>
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
                  </tr>
                </thead>
                <tbody>
                  {page.content.map((produto) => (
                    <tr key={produto.id}>
                      <td className={styles.mono}>{produto.codigoBarras}</td>
                      <td>{produto.nome}</td>
                      <td>{produto.categoria}</td>
                      <td>{produto.tipoProduto}</td>
                      <td className={styles.preco}>{formatPreco(produto.precoVenda)}</td>
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
