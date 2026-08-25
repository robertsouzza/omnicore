import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { listarVendas } from '../api/vendas'
import { useAuth } from '../auth/AuthContext'
import { usePaginatedResource } from '../hooks'
import {
  formatDataHoraVenda,
  formatPreco,
  labelStatusVenda,
  resumoClienteVenda,
  type StatusVenda,
  type Venda,
} from '../types/venda'
import styles from './SalaoVendasPage.module.css'

function StatusBadge({ status }: { status: StatusVenda }) {
  const className =
    status === 'CANCELADA'
      ? styles.badgeCancelada
      : status === 'PAGA' || status === 'CONCLUIDA'
        ? styles.badgeOk
        : styles.badgePendente

  return <span className={className}>{labelStatusVenda(status)}</span>
}

export function SalaoVendasPage() {
  const { session } = useAuth()

  const fetchPage = useCallback(
    (page: number) => {
      if (!session) throw new Error('Sem sessão')
      return listarVendas(session.token, { page, size: 15 })
    },
    [session],
  )

  const { page, initialLoading, refreshing, loadError, listaPronta } = usePaginatedResource<Venda>(
    fetchPage,
    {
      enabled: !!session,
      errorMessage: 'Erro ao carregar vendas.',
    },
  )

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Vendas recentes</h1>

      {initialLoading && <p className={styles.status}>Carregando…</p>}
      {loadError && <p className={styles.error}>{loadError}</p>}

      {listaPronta && !loadError && page && (
        <>
          {page.content.length === 0 ? (
            <p className={styles.status}>Nenhuma venda registrada ainda.</p>
          ) : (
            <ul className={styles.list}>
              {page.content.map((venda) => (
                <li key={venda.id}>
                  <Link to={`/vendas/${venda.id}`} className={styles.card}>
                    <div className={styles.cardTop}>
                      <div>
                        <p className={styles.cardTitle}>Venda #{venda.id}</p>
                        <p className={styles.cardMeta}>{formatDataHoraVenda(venda.dataHora)}</p>
                        <p className={styles.cardMeta}>{resumoClienteVenda(venda)}</p>
                      </div>
                      <StatusBadge status={venda.status} />
                    </div>
                    <p className={styles.total}>{formatPreco(venda.valorTotal)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {refreshing && <p className={styles.refreshHint}>Atualizando…</p>}
        </>
      )}
    </section>
  )
}
