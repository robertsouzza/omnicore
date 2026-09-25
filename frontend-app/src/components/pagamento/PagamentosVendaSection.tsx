import type { PagamentoVenda } from '../../types/pagamento'
import {
  labelFormaPagamento,
  labelStatusPagamento,
  resumoParcelasPagamento,
} from '../../types/pagamento'
import { formatDataHoraVenda, formatPreco } from '../../types/venda'
import styles from './PagamentosVendaSection.module.css'

function StatusBadge({ status }: { status: PagamentoVenda['status'] }) {
  const className =
    status === 'APROVADO'
      ? styles.badgeOk
      : status === 'RECUSADO' || status === 'ESTORNADO'
        ? styles.badgeErro
        : styles.badgePendente

  return <span className={className}>{labelStatusPagamento(status)}</span>
}

export interface PagamentosVendaSectionProps {
  pagamentos: PagamentoVenda[]
  loading?: boolean
}

export function PagamentosVendaSection({ pagamentos, loading }: PagamentosVendaSectionProps) {
  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Pagamentos</h2>

      {loading && <p className={styles.status}>Carregando pagamentos…</p>}

      {!loading && pagamentos.length === 0 && (
        <p className={styles.empty}>Nenhum pagamento registrado ainda.</p>
      )}

      {!loading && pagamentos.length > 0 && (
        <>
          <div className={styles.cardList}>
            {pagamentos.map((p) => (
              <article key={p.id} className={styles.card}>
                <div className={styles.cardHead}>
                  <strong>{labelFormaPagamento(p.forma)}</strong>
                  <StatusBadge status={p.status} />
                </div>
                <p className={styles.cardMeta}>{formatDataHoraVenda(p.dataHora)}</p>
                <p className={styles.cardValor}>{formatPreco(p.valor)}</p>
                {p.forma === 'CREDITO' && p.parcelas != null && p.parcelas > 0 && (
                  <p className={styles.cardMeta}>{resumoParcelasPagamento(p.parcelas)}</p>
                )}
                {p.nsu && (
                  <p className={styles.cardMeta}>
                    NSU: <span className={styles.mono}>{p.nsu}</span>
                  </p>
                )}
                {p.forma === 'DINHEIRO' && p.troco != null && p.troco > 0 && (
                  <p className={styles.cardMeta}>Troco: {formatPreco(p.troco)}</p>
                )}
              </article>
            ))}
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Forma</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Parcelas</th>
                  <th>NSU</th>
                  <th>Troco</th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDataHoraVenda(p.dataHora)}</td>
                    <td>{labelFormaPagamento(p.forma)}</td>
                    <td>{formatPreco(p.valor)}</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td>
                      {p.forma === 'CREDITO' && p.parcelas != null && p.parcelas > 0
                        ? resumoParcelasPagamento(p.parcelas)
                        : '—'}
                    </td>
                    <td className={styles.mono}>{p.nsu ?? '—'}</td>
                    <td>
                      {p.forma === 'DINHEIRO' && p.troco != null && p.troco > 0
                        ? formatPreco(p.troco)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
