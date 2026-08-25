import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { CancelarVendaModal } from '../components/CancelarVendaModal'
import { buscarCliente } from '../api/clientes'
import { buscarVenda, cancelarVenda } from '../api/vendas'
import { useAuth } from '../auth/AuthContext'
import type { CancelarVendaRequest, Venda } from '../types/venda'
import {
  formatDataHoraVenda,
  formatPreco,
  labelStatusVenda,
  vendaPodeCancelar,
} from '../types/venda'
import { getErrorMessage } from '../utils/validation'
import styles from './VendaDetalhePage.module.css'

function StatusBadge({ status }: { status: Venda['status'] }) {
  const className =
    status === 'CANCELADA'
      ? styles.badgeCancelada
      : status === 'PAGA' || status === 'CONCLUIDA'
        ? styles.badgeOk
        : styles.badgePendente

  return <span className={className}>{labelStatusVenda(status)}</span>
}

export function VendaDetalhePage() {
  const { id: idParam } = useParams()
  const id = Number(idParam)
  const navigate = useNavigate()
  const { session, logout } = useAuth()

  const [venda, setVenda] = useState<Venda | null>(null)
  const [clienteNome, setClienteNome] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false)

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
    if (!session || !Number.isFinite(id)) return

    setLoading(true)
    setLoadError(null)

    try {
      const data = await buscarVenda(session.token, id)
      setVenda(data)

      if (data.clienteId != null) {
        try {
          const cliente = await buscarCliente(session.token, data.clienteId)
          setClienteNome(cliente.nomeCompleto)
        } catch {
          setClienteNome(null)
        }
      } else {
        setClienteNome(null)
      }
    } catch (err) {
      if (handleUnauthorized(err)) return
      setLoadError(getErrorMessage(err, 'Erro ao carregar a venda.'))
    } finally {
      setLoading(false)
    }
  }, [session, id, handleUnauthorized])

  useEffect(() => {
    void load()
  }, [load])

  async function confirmarCancelamento(payload: CancelarVendaRequest) {
    if (!session || !venda) return

    setCancelling(true)
    setActionError(null)

    try {
      const atualizada = await cancelarVenda(session.token, venda.id, payload)
      setVenda(atualizada)
      setModalCancelarAberto(false)
    } catch (err) {
      if (handleUnauthorized(err)) return
      setActionError(getErrorMessage(err, 'Não foi possível cancelar a venda.'))
    } finally {
      setCancelling(false)
    }
  }

  function clienteDisplay(): string {
    if (!venda) return '—'
    if (venda.nomeClienteOcasional?.trim()) return venda.nomeClienteOcasional.trim()
    if (clienteNome) return clienteNome
    if (venda.clienteId != null) return `Cliente #${venda.clienteId}`
    return 'Consumidor'
  }

  if (!Number.isFinite(id)) {
    return (
      <section className={styles.page}>
        <p className={styles.error}>Venda inválida.</p>
        <Link to="/vendas" className={styles.backLink}>
          ← Voltar às vendas
        </Link>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <Link to="/vendas" className={styles.backLink}>
        ← Voltar às vendas
      </Link>

      {loading && <p className={styles.status}>Carregando…</p>}
      {loadError && <p className={styles.error}>{loadError}</p>}

      {venda && !loadError && (
        <>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>Venda #{venda.id}</h1>
              <p className={styles.subtitle}>{formatDataHoraVenda(venda.dataHora)}</p>
            </div>
            <StatusBadge status={venda.status} />
          </header>

          <div className={styles.metaGrid}>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>Cliente</span>
              <strong>{clienteDisplay()}</strong>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>Vendedor</span>
              <strong>{venda.vendedorId != null ? `#${venda.vendedorId}` : '—'}</strong>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>Total</span>
              <strong className={styles.total}>{formatPreco(venda.valorTotal)}</strong>
            </div>
          </div>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Itens</h2>

            <div className={styles.itemList}>
              {venda.itens.map((item) => {
                const desconto = item.desconto ?? 0
                const subtotal = (item.precoUnitario - desconto) * item.quantidade
                return (
                  <article key={item.id} className={styles.itemCard}>
                    <strong>{item.produto.nome}</strong>
                    <p className={styles.itemMeta}>
                      {item.quantidade} × {formatPreco(item.precoUnitario)}
                      {desconto > 0 && ` (−${formatPreco(desconto)} desc.)`}
                    </p>
                    <p className={styles.itemSubtotal}>{formatPreco(subtotal)}</p>
                  </article>
                )
              })}
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Qtd</th>
                    <th>Preço un.</th>
                    <th>Desconto</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {venda.itens.map((item) => {
                    const desconto = item.desconto ?? 0
                    const subtotal = (item.precoUnitario - desconto) * item.quantidade
                    return (
                      <tr key={item.id}>
                        <td>{item.produto.nome}</td>
                        <td>{item.quantidade}</td>
                        <td>{formatPreco(item.precoUnitario)}</td>
                        <td>{desconto > 0 ? formatPreco(desconto) : '—'}</td>
                        <td className={styles.total}>{formatPreco(subtotal)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {vendaPodeCancelar(venda) && (
            <button
              type="button"
              className={styles.cancelBtn}
              disabled={cancelling}
              onClick={() => {
                setActionError(null)
                setModalCancelarAberto(true)
              }}
            >
              Cancelar venda
            </button>
          )}

          {venda.status === 'CANCELADA' && (
            <p className={styles.cancelledNote}>
              Esta venda foi cancelada.
              {venda.motivoCancelamento && (
                <>
                  {' '}
                  Motivo: <em>{venda.motivoCancelamento}</em>
                </>
              )}
            </p>
          )}
        </>
      )}

      {session && venda && modalCancelarAberto && (
        <CancelarVendaModal
          venda={venda}
          perfilLogado={session.perfil}
          open
          submitting={cancelling}
          error={actionError}
          onClose={() => {
            if (cancelling) return
            setModalCancelarAberto(false)
            setActionError(null)
          }}
          onConfirm={confirmarCancelamento}
        />
      )}

      {!loading && !loadError && !venda && (
        <button type="button" className={styles.linkishBtn} onClick={() => navigate('/vendas')}>
          Voltar à listagem
        </button>
      )}
    </section>
  )
}
