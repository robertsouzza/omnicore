import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarVendas, pagarVenda } from '../api/vendas'
import { PagamentoModal } from '../components/pagamento/PagamentoModal'
import { useAuth } from '../auth/AuthContext'
import { useAsyncAction, usePaginatedResource, usePollVendaStatus } from '../hooks'
import type { PagarVendaRequest } from '../types/pagamento'
import type { Venda } from '../types/venda'
import {
  formatDataHoraVenda,
  formatPreco,
  labelStatusVenda,
  resumoClienteVenda,
  vendaPodePagar,
} from '../types/venda'
import { resolverAguardandoPagamentoExterno } from '../utils/resolverAguardandoPagamento'
import type { AguardandoPagamentoExterno } from '../utils/urlExperiencia'
import styles from './CaixaPage.module.css'

export function CaixaPage() {
  const { session } = useAuth()
  const [payError, setPayError] = useState<string | null>(null)
  const [modalVenda, setModalVenda] = useState<Venda | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [aguardandoExterno, setAguardandoExterno] = useState<AguardandoPagamentoExterno | null>(
    null,
  )

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
    load,
    listaPronta,
  } = usePaginatedResource(fetchPage, {
    enabled: !!session,
    errorMessage: 'Erro ao carregar vendas pendentes.',
  })

  const { actionKey, execute } = useAsyncAction()

  const handleVendaAtualizadaPoll = useCallback(
    (atualizada: Venda) => {
      setModalVenda(atualizada)
      if (atualizada.status !== 'PENDENTE') {
        setAguardandoExterno(null)
        setModalOpen(false)
        setModalVenda(null)
        setModalError(null)
        void load()
      }
    },
    [load],
  )

  const { atualizar: atualizarStatusVenda, atualizando: atualizandoStatusVenda } =
    usePollVendaStatus(
      session?.token,
      modalVenda?.id,
      modalOpen && aguardandoExterno != null,
      handleVendaAtualizadaPoll,
    )

  function abrirPagamento(venda: Venda) {
    if (!vendaPodePagar(venda)) return
    setModalVenda(venda)
    setModalOpen(true)
    setModalError(null)
    setAguardandoExterno(null)
    setPayError(null)
  }

  function fecharModal() {
    if (actionKey != null) return
    setModalOpen(false)
    setModalVenda(null)
    setModalError(null)
    setAguardandoExterno(null)
  }

  async function confirmarPagamentoComForma(pagamento: PagarVendaRequest) {
    if (!session || !modalVenda) return

    setModalError(null)
    setPayError(null)
    await execute(
      modalVenda.id,
      async () => {
        const venda = await pagarVenda(session.token, modalVenda.id, pagamento)
        setModalVenda(venda)
        if (venda.status === 'PENDENTE') {
          const info = await resolverAguardandoPagamentoExterno(session.token, venda.id)
          if (info) {
            setAguardandoExterno(info)
            setModalError(null)
          } else {
            setModalError(
              'Pagamento iniciado, mas não foi possível obter o link da experiência externa.',
            )
          }
          return
        }
        setModalOpen(false)
        setModalVenda(null)
        setAguardandoExterno(null)
        await load()
      },
      setModalError,
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
                      onClick={() => abrirPagamento(venda)}
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

      <PagamentoModal
        venda={modalVenda}
        open={modalOpen}
        submitting={actionKey != null}
        error={modalError}
        aguardandoExterno={aguardandoExterno}
        atualizandoStatus={atualizandoStatusVenda}
        onAtualizarStatus={() => void atualizarStatusVenda()}
        onClose={fecharModal}
        onConfirm={(pagamento) => void confirmarPagamentoComForma(pagamento)}
      />
    </section>
  )
}
