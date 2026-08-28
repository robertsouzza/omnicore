import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarVendas, pagarVenda } from '../api/vendas'
import { useAuth } from '../auth/AuthContext'
import { useAsyncAction, usePaginatedResource } from '../hooks'
import type { Venda } from '../types/venda'
import {
  formatDataHoraVenda,
  formatPreco,
  labelStatusVenda,
  resumoClienteVenda,
  vendaPodePagar,
} from '../types/venda'
import styles from './CaixaPage.module.css'

export function CaixaPage() {
  const { session } = useAuth()
  const [payError, setPayError] = useState<string | null>(null)

  const fetchPage = useCallback(
    (page: number) => {
      if (!session) throw new Error('Sem sessão')
      return listarVendas(session.token, { page, status: 'PENDENTE' })
    },
    [session],
  )

  const {
    page,
    setPageNumber,
    initialLoading,
    refreshing,
    loadError,
    setLoadError,
    load,
    listaPronta,
  } = usePaginatedResource(fetchPage, {
    enabled: !!session,
    errorMessage: 'Erro ao carregar vendas pendentes.',
  })

  const { actionKey, execute } = useAsyncAction()

  async function confirmarPagamento(venda: Venda) {
    if (!session || !vendaPodePagar(venda)) return

    setPayError(null)
    setLoadError(null)
    await execute(
      venda.id,
      async () => {
        await pagarVenda(session.token, venda.id)
        await load()
      },
      setPayError,
      'Não foi possível confirmar o pagamento.',
    )
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Caixa</h1>
          <p className={styles.subtitle}>
            Vendas pendentes do salão — confirme o pagamento para debitar estoque
          </p>
        </div>
        <div className={styles.headerActions}>
          {page && (
            <span className={styles.count}>
              {page.totalElements}{' '}
              {page.totalElements === 1 ? 'pendente' : 'pendentes'}
            </span>
          )}
          {refreshing && <span className={styles.status}>Atualizando…</span>}
        </div>
      </div>

      {initialLoading && <p className={styles.status}>Carregando…</p>}
      {loadError && <p className={styles.error}>{loadError}</p>}
      {payError && <p className={styles.error}>{payError}</p>}

      {listaPronta && !loadError && page && (
        <>
          {page.content.length === 0 ? (
            <p className={styles.status}>Nenhuma venda pendente no momento.</p>
          ) : (
            <div className={styles.cardList}>
              {page.content.map((venda) => (
                <article key={venda.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div>
                      <h2 className={styles.cardTitle}>Venda #{venda.id}</h2>
                      <p className={styles.cardMetaLine}>{formatDataHoraVenda(venda.dataHora)}</p>
                    </div>
                    <span className={styles.badgePendente}>{labelStatusVenda(venda.status)}</span>
                  </div>
                  <dl className={styles.cardMeta}>
                    <div>
                      <dt>Cliente</dt>
                      <dd>{resumoClienteVenda(venda)}</dd>
                    </div>
                    <div>
                      <dt>Total</dt>
                      <dd className={styles.total}>{formatPreco(venda.valorTotal)}</dd>
                    </div>
                    <div>
                      <dt>Itens</dt>
                      <dd>{venda.itens.length}</dd>
                    </div>
                    <div>
                      <dt>Vendedor</dt>
                      <dd>{venda.vendedorId != null ? `#${venda.vendedorId}` : '—'}</dd>
                    </div>
                  </dl>
                  <div className={styles.cardActions}>
                    <Link to={`/vendas/${venda.id}`} className={styles.linkBtn}>
                      Ver detalhes
                    </Link>
                    <button
                      type="button"
                      className={styles.payBtn}
                      disabled={actionKey === venda.id}
                      onClick={() => void confirmarPagamento(venda)}
                    >
                      {actionKey === venda.id ? 'Confirmando…' : 'Confirmar pagamento'}
                    </button>
                  </div>
                </article>
              ))}
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
              <span className={styles.paginationInfo}>
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
