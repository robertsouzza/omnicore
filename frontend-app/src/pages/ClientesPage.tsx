import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/client'
import {
  buscarClientePorCpf,
  inativarCliente,
  listarClientes,
} from '../api/clientes'
import { useAuth } from '../auth/AuthContext'
import type { Cliente, Page } from '../types/cliente'
import { formatEnderecoResumo } from '../utils/cep'
import { formatCpf, maskCpfInput, onlyDigits } from '../utils/cpf'
import { formatCelularDisplay, normalizePaisIso } from '../utils/telefone'
import { getErrorMessage } from '../utils/validation'
import styles from './ClientesPage.module.css'

interface ClienteActionsProps {
  cliente: Cliente
  actionId: number | null
  onInativar: (cliente: Cliente) => void
  className?: string
}

function ClienteActions({ cliente, actionId, onInativar, className }: ClienteActionsProps) {
  return (
    <div className={className ?? styles.rowActions}>
      <Link to={`/clientes/${cliente.id}/editar`} className={styles.linkBtn}>
        Editar
      </Link>
      {cliente.ativo && (
        <button
          type="button"
          className={styles.dangerBtn}
          disabled={actionId === cliente.id}
          onClick={() => onInativar(cliente)}
        >
          {actionId === cliente.id ? 'Inativando…' : 'Inativar'}
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

function ClienteCard({
  cliente,
  incluirInativos,
  actionId,
  onInativar,
}: {
  cliente: Cliente
  incluirInativos: boolean
  actionId: number | null
  onInativar: (cliente: Cliente) => void
}) {
  return (
    <article
      className={`${styles.card}${!cliente.ativo ? ` ${styles.cardInactive}` : ''}`}
    >
      <div className={styles.cardTop}>
        <h2 className={styles.cardTitle}>{cliente.nomeCompleto}</h2>
        {incluirInativos && <StatusBadge ativo={cliente.ativo} />}
      </div>
      <dl className={styles.cardMeta}>
        <div>
          <dt>CPF</dt>
          <dd className={styles.mono}>{formatCpf(cliente.cpf)}</dd>
        </div>
        <div>
          <dt>Celular</dt>
          <dd>{formatCelularDisplay(normalizePaisIso(cliente.codigoPais), cliente.celular)}</dd>
        </div>
        {formatEnderecoResumo(cliente) && (
          <div className={styles.fullWidthMeta}>
            <dt>Endereço</dt>
            <dd>{formatEnderecoResumo(cliente)}</dd>
          </div>
        )}
        <div className={styles.fullWidthMeta}>
          <dt>E-mail</dt>
          <dd>{cliente.email}</dd>
        </div>
      </dl>
      <ClienteActions
        cliente={cliente}
        actionId={actionId}
        onInativar={onInativar}
        className={styles.cardActions}
      />
    </article>
  )
}

function ClienteTableRow({
  cliente,
  incluirInativos,
  actionId,
  onInativar,
}: {
  cliente: Cliente
  incluirInativos: boolean
  actionId: number | null
  onInativar: (cliente: Cliente) => void
}) {
  return (
    <tr className={!cliente.ativo ? styles.inactiveRow : undefined}>
      <td>{cliente.nomeCompleto}</td>
      <td className={styles.mono}>{formatCpf(cliente.cpf)}</td>
      <td>{cliente.email}</td>
      <td>{formatCelularDisplay(normalizePaisIso(cliente.codigoPais), cliente.celular)}</td>
      {incluirInativos && (
        <td>
          <StatusBadge ativo={cliente.ativo} />
        </td>
      )}
      <td>
        <ClienteActions cliente={cliente} actionId={actionId} onInativar={onInativar} />
      </td>
    </tr>
  )
}

export function ClientesPage() {
  const { session, logout } = useAuth()
  const [page, setPage] = useState<Page<Cliente> | null>(null)
  const [pageNumber, setPageNumber] = useState(0)
  const [incluirInativos, setIncluirInativos] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<number | null>(null)
  const [cpfBusca, setCpfBusca] = useState('')
  const [buscaResultado, setBuscaResultado] = useState<Cliente | null>(null)
  const [buscaAtiva, setBuscaAtiva] = useState(false)
  const [buscando, setBuscando] = useState(false)

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
    if (!session || buscaAtiva) return

    setLoading(true)
    setError(null)

    try {
      const data = await listarClientes(session.token, {
        page: pageNumber,
        incluirInativos,
      })
      setPage(data)
    } catch (err) {
      if (handleUnauthorized(err)) return
      setError(getErrorMessage(err, 'Erro ao carregar clientes.'))
    } finally {
      setLoading(false)
    }
  }, [session, pageNumber, incluirInativos, buscaAtiva, handleUnauthorized])

  useEffect(() => {
    void load()
  }, [load])

  async function handleBuscarCpf(event: FormEvent) {
    event.preventDefault()
    if (!session) return

    const digits = onlyDigits(cpfBusca)
    if (digits.length < 11) {
      setError('Informe um CPF com 11 dígitos para buscar.')
      return
    }

    setBuscando(true)
    setError(null)
    setBuscaAtiva(true)
    setBuscaResultado(null)

    try {
      const cliente = await buscarClientePorCpf(session.token, digits)
      setBuscaResultado(cliente)
    } catch (err) {
      if (handleUnauthorized(err)) return
      setError(getErrorMessage(err, 'Cliente não encontrado para este CPF.'))
    } finally {
      setBuscando(false)
    }
  }

  function limparBusca() {
    setCpfBusca('')
    setBuscaAtiva(false)
    setBuscaResultado(null)
    setError(null)
  }

  async function handleInativar(cliente: Cliente) {
    if (!session || !cliente.ativo) return

    const confirmed = window.confirm(
      `Inativar "${cliente.nomeCompleto}"?\n\nO cliente permanece no histórico, mas deixa de aparecer na listagem ativa.`,
    )
    if (!confirmed) return

    setActionId(cliente.id)
    setError(null)

    try {
      await inativarCliente(session.token, cliente.id)
      if (buscaAtiva) {
        setBuscaResultado((current) =>
          current && current.id === cliente.id ? { ...current, ativo: false } : current,
        )
      } else {
        await load()
      }
    } catch (err) {
      if (handleUnauthorized(err)) return
      setError(getErrorMessage(err, 'Não foi possível inativar o cliente.'))
    } finally {
      setActionId(null)
    }
  }

  const clientesExibidos = buscaAtiva
    ? buscaResultado
      ? [buscaResultado]
      : []
    : (page?.content ?? [])

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Clientes</h1>
          <p className={styles.subtitle}>Cadastro de clientes do OmniCore</p>
        </div>
        <div className={styles.headerActions}>
          {!buscaAtiva && page && (
            <span className={styles.count}>
              {page.totalElements} {page.totalElements === 1 ? 'cliente' : 'clientes'}
            </span>
          )}
          <Link to="/clientes/novo" className={styles.newBtn}>
            + Novo cliente
          </Link>
        </div>
      </div>

      <form className={styles.searchForm} onSubmit={handleBuscarCpf}>
        <label className={styles.searchLabel}>
          Buscar por CPF
          <input
            className={styles.searchInput}
            value={cpfBusca}
            onChange={(e) => setCpfBusca(maskCpfInput(e.target.value))}
            placeholder="000.000.000-00"
            inputMode="numeric"
            maxLength={14}
            disabled={buscando}
          />
        </label>
        <button type="submit" className={styles.searchBtn} disabled={buscando}>
          {buscando ? 'Buscando…' : 'Buscar'}
        </button>
        {buscaAtiva && (
          <button type="button" className={styles.clearBtn} onClick={limparBusca}>
            Limpar busca
          </button>
        )}
      </form>

      {!buscaAtiva && (
        <label className={styles.filter}>
          <input
            type="checkbox"
            checked={incluirInativos}
            onChange={(e) => {
              setIncluirInativos(e.target.checked)
              setPageNumber(0)
            }}
          />
          Incluir clientes inativos
        </label>
      )}

      {(loading || buscando) && <p className={styles.status}>Carregando…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !buscando && !error && (
        <>
          {clientesExibidos.length === 0 ? (
            <p className={styles.status}>
              {buscaAtiva ? 'Nenhum cliente encontrado para este CPF.' : 'Nenhum cliente encontrado.'}
            </p>
          ) : (
            <>
              <div className={styles.cardList}>
                {clientesExibidos.map((cliente) => (
                  <ClienteCard
                    key={cliente.id}
                    cliente={cliente}
                    incluirInativos={incluirInativos || buscaAtiva}
                    actionId={actionId}
                    onInativar={(c) => void handleInativar(c)}
                  />
                ))}
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>CPF</th>
                      <th>E-mail</th>
                      <th>Celular</th>
                      {(incluirInativos || buscaAtiva) && <th>Status</th>}
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesExibidos.map((cliente) => (
                      <ClienteTableRow
                        key={cliente.id}
                        cliente={cliente}
                        incluirInativos={incluirInativos || buscaAtiva}
                        actionId={actionId}
                        onInativar={(c) => void handleInativar(c)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!buscaAtiva && page && page.totalPages > 1 && (
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
