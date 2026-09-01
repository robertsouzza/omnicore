import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { cancelarVenda, listarVendas } from '../api/vendas'
import { CancelarVendaModal } from '../components/CancelarVendaModal'
import { useAuth } from '../auth/AuthContext'
import { useAsyncAction, usePaginatedResource, useVendasListAutoRefresh } from '../hooks'
import type { CancelarVendaRequest, StatusVenda, Venda } from '../types/venda'
import {
  STATUS_VENDA,
  formatDataHoraVenda,
  formatPreco,
  labelStatusVenda,
  resumoClienteVenda,
  vendaPodeCancelar,
} from '../types/venda'
import styles from './VendasPage.module.css'

function StatusBadge({ status }: { status: StatusVenda }) {
  const className =
    status === 'CANCELADA'
      ? styles.badgeCancelada
      : status === 'PAGA' || status === 'CONCLUIDA'
        ? styles.badgeOk
        : status === 'PENDENTE' || status === 'AGUARDANDO_RETIRADA'
          ? styles.badgePendente
          : styles.badgeDefault

  return <span className={className}>{labelStatusVenda(status)}</span>
}

export function VendasPage() {
  const { session } = useAuth()
  const [statusFiltro, setStatusFiltro] = useState<StatusVenda | ''>('')
  const [vendaParaCancelar, setVendaParaCancelar] = useState<Venda | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const fetchPage = useCallback(
    (page: number) => {
      if (!session) throw new Error('Sem sessão')
      return listarVendas(session.token, {
        page,
        status: statusFiltro || undefined,
      })
    },
    [session, statusFiltro],
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
    errorMessage: 'Erro ao carregar vendas.',
  })

  useVendasListAutoRefresh(!!session && listaPronta, load)

  const { actionKey, execute } = useAsyncAction()

  function abrirCancelamento(venda: Venda) {
    if (!vendaPodeCancelar(venda)) return
    setCancelError(null)
    setVendaParaCancelar(venda)
  }

  async function confirmarCancelamento(payload: CancelarVendaRequest) {
    if (!session || !vendaParaCancelar) return

    setLoadError(null)
    await execute(
      vendaParaCancelar.id,
      async () => {
        await cancelarVenda(session.token, vendaParaCancelar.id, payload)
        setVendaParaCancelar(null)
        await load()
      },
      setCancelError,
      'Não foi possível cancelar a venda.',
    )
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Vendas</h1>
          <p className={styles.subtitle}>
            Pedidos registrados no OmniCore · atualiza automaticamente
          </p>
        </div>
        <div className={styles.headerActions}>
          {page && (
            <span className={styles.count}>
              {page.totalElements} {page.totalElements === 1 ? 'venda' : 'vendas'}
            </span>
          )}
          <Link to="/vendas/nova" className={styles.newBtn}>
            + Nova venda
          </Link>
        </div>
      </div>

      <div className={styles.filterPanel}>
        <label className={styles.filterLabel}>
          Status
          <select
            className={styles.filterSelect}
            value={statusFiltro}
            onChange={(e) => {
              setStatusFiltro(e.target.value as StatusVenda | '')
              setPageNumber(0)
            }}
          >
            <option value="">Todos</option>
            {STATUS_VENDA.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        {refreshing && <span className={styles.filterHint}>Atualizando…</span>}
      </div>

      {initialLoading && <p className={styles.status}>Carregando…</p>}
      {loadError && <p className={styles.error}>{loadError}</p>}

      {listaPronta && !loadError && page && (
        <>
          {page.content.length === 0 ? (
            <p className={styles.status}>
              {statusFiltro
                ? 'Nenhuma venda encontrada para o status selecionado.'
                : 'Nenhuma venda registrada ainda.'}
            </p>
          ) : (
            <>
              <div className={styles.cardList}>
                {page.content.map((venda) => (
                  <article key={venda.id} className={styles.card}>
                    <div className={styles.cardTop}>
                      <div>
                        <h2 className={styles.cardTitle}>Venda #{venda.id}</h2>
                        <p className={styles.cardMetaLine}>{formatDataHoraVenda(venda.dataHora)}</p>
                      </div>
                      <StatusBadge status={venda.status} />
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
                    </dl>
                    <div className={styles.cardActions}>
                      <Link to={`/vendas/${venda.id}`} className={styles.linkBtn}>
                        Detalhes
                      </Link>
                      {vendaPodeCancelar(venda) && (
                        <button
                          type="button"
                          className={styles.dangerBtn}
                          disabled={actionKey === venda.id}
                          onClick={() => abrirCancelamento(venda)}
                        >
                          {actionKey === venda.id ? 'Cancelando…' : 'Cancelar'}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Data</th>
                      <th>Cliente</th>
                      <th>Status</th>
                      <th>Itens</th>
                      <th>Total</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.content.map((venda) => (
                      <tr key={venda.id}>
                        <td className={styles.mono}>{venda.id}</td>
                        <td className={styles.nowrap}>{formatDataHoraVenda(venda.dataHora)}</td>
                        <td>{resumoClienteVenda(venda)}</td>
                        <td>
                          <StatusBadge status={venda.status} />
                        </td>
                        <td>{venda.itens.length}</td>
                        <td className={styles.total}>{formatPreco(venda.valorTotal)}</td>
                        <td>
                          <div className={styles.rowActions}>
                            <Link to={`/vendas/${venda.id}`} className={styles.linkBtn}>
                              Detalhes
                            </Link>
                            {vendaPodeCancelar(venda) && (
                              <button
                                type="button"
                                className={styles.dangerBtn}
                                disabled={actionKey === venda.id}
                                onClick={() => abrirCancelamento(venda)}
                              >
                                {actionKey === venda.id ? 'Cancelando…' : 'Cancelar'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {page.totalPages > 0 && (
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
                {page.totalElements === 1 ? 'venda no total' : 'vendas no total'}
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

      {session && vendaParaCancelar && (
        <CancelarVendaModal
          venda={vendaParaCancelar}
          perfilLogado={session.perfil}
          open
          submitting={actionKey === vendaParaCancelar.id}
          error={cancelError}
          onClose={() => {
            if (actionKey !== null) return
            setVendaParaCancelar(null)
            setCancelError(null)
          }}
          onConfirm={confirmarCancelamento}
        />
      )}
    </section>
  )
}
