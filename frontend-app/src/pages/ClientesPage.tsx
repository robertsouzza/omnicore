import { type FormEvent, useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  buscarClientePorDocumento,
  inativarCliente,
  listarClientes,
} from '../api/clientes'
import { useAuth } from '../auth/AuthContext'
import { useAsyncAction, useDebouncedSearch, usePaginatedResource, useUnauthorizedHandler } from '../hooks'
import type { Cliente, TipoDocumento } from '../types/cliente'
import { TIPOS_DOCUMENTO, TIPO_DOCUMENTO_PADRAO } from '../types/cliente'
import { formatEnderecoResumo } from '../utils/cep'
import { isCpfValido } from '../utils/cpf'
import {
  formatDocumentoDisplay,
  maskDocumentoInput,
  normalizeNumeroDocumento,
} from '../utils/documento'
import { formatCelularDisplay, normalizePaisIso } from '../utils/telefone'
import { getErrorMessage } from '../utils/validation'
import styles from './ClientesPage.module.css'

/** Mínimo de letras para disparar busca por nome no servidor (escala). */
const NOME_BUSCA_MIN_API = 3

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
          <dt>Documento</dt>
          <dd className={styles.mono}>
            {formatDocumentoDisplay(cliente.tipoDocumento, cliente.numeroDocumento)}
          </dd>
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
      <td className={styles.mono}>
        {formatDocumentoDisplay(cliente.tipoDocumento, cliente.numeroDocumento)}
      </td>
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
  const { session } = useAuth()
  const [pageNumber, setPageNumber] = useState(0)
  const [incluirInativos, setIncluirInativos] = useState(false)
  const [searchNotice, setSearchNotice] = useState<string | null>(null)
  const [tipoDocumentoBusca, setTipoDocumentoBusca] = useState<TipoDocumento>(TIPO_DOCUMENTO_PADRAO)
  const [documentoBusca, setDocumentoBusca] = useState('')
  const [clientePorDocumento, setClientePorDocumento] = useState<Cliente | null>(null)
  const [buscandoDocumento, setBuscandoDocumento] = useState(false)

  const handleUnauthorized = useUnauthorizedHandler()
  const resetPage = useCallback(() => setPageNumber(0), [])

  const nomeSearch = useDebouncedSearch({
    minLength: NOME_BUSCA_MIN_API,
    onDebouncedChange: () => {
      resetPage()
      setClientePorDocumento(null)
    },
  })

  const fetchPage = useCallback(
    (page: number) => {
      if (!session) throw new Error('Sem sessão')
      return listarClientes(session.token, {
        page,
        incluirInativos,
        nome: nomeSearch.debouncedValue || undefined,
      })
    },
    [session, incluirInativos, nomeSearch.debouncedValue],
  )

  const {
    page,
    initialLoading,
    refreshing,
    loadError,
    setLoadError,
    load,
    listaPronta,
  } = usePaginatedResource(fetchPage, {
    enabled: !!session,
    errorMessage: 'Erro ao carregar clientes.',
    pageNumber,
    setPageNumber,
  })

  const { actionKey, execute } = useAsyncAction()

  async function handleBuscarDocumento(event: FormEvent) {
    event.preventDefault()
    if (!session) return

    const numero = normalizeNumeroDocumento(tipoDocumentoBusca, documentoBusca)

    if (tipoDocumentoBusca === 'CPF') {
      if (numero.length < 11) {
        setSearchNotice('Informe um CPF com 11 dígitos para buscar.')
        setClientePorDocumento(null)
        return
      }
      if (!isCpfValido(numero)) {
        setSearchNotice('Informe um CPF válido para buscar.')
        setClientePorDocumento(null)
        return
      }
    } else if (numero.length < 3) {
      setSearchNotice('Informe pelo menos 3 caracteres do documento para buscar.')
      setClientePorDocumento(null)
      return
    }

    setBuscandoDocumento(true)
    setSearchNotice(null)

    try {
      const cliente = await buscarClientePorDocumento(session.token, tipoDocumentoBusca, numero)
      setClientePorDocumento(cliente)
      setSearchNotice(null)
    } catch (err) {
      if (handleUnauthorized(err)) return
      setClientePorDocumento(null)
      setSearchNotice(getErrorMessage(err, 'Nenhum cliente encontrado para este documento.'))
    } finally {
      setBuscandoDocumento(false)
    }
  }

  function limparBuscaDocumento() {
    setDocumentoBusca('')
    setTipoDocumentoBusca(TIPO_DOCUMENTO_PADRAO)
    setClientePorDocumento(null)
    setSearchNotice(null)
  }

  async function handleInativar(cliente: Cliente) {
    if (!session || !cliente.ativo) return

    const confirmed = window.confirm(
      `Inativar "${cliente.nomeCompleto}"?\n\nO cliente permanece no histórico, mas deixa de aparecer na listagem ativa.`,
    )
    if (!confirmed) return

    setLoadError(null)
    await execute(
      cliente.id,
      async () => {
        await inativarCliente(session.token, cliente.id)
        if (clientePorDocumento?.id === cliente.id) {
          setClientePorDocumento({ ...clientePorDocumento, ativo: false })
        }
        await load()
      },
      setLoadError,
      'Não foi possível inativar o cliente.',
    )
  }

  const clientesExibidos = useMemo(() => {
    if (clientePorDocumento) {
      return [clientePorDocumento]
    }

    const termo = nomeSearch.normalized.toLowerCase()
    const base = page?.content ?? []

    if (!termo) {
      return base
    }

    return base.filter((cliente) => cliente.nomeCompleto.toLowerCase().includes(termo))
  }, [clientePorDocumento, page, nomeSearch.normalized])

  const totalExibido = clientePorDocumento ? 1 : (page?.totalElements ?? 0)

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Clientes</h1>
          <p className={styles.subtitle}>Cadastro de clientes do OmniCore</p>
        </div>
        <div className={styles.headerActions}>
          {page && (
            <span className={styles.count}>
              {totalExibido} {totalExibido === 1 ? 'cliente' : 'clientes'}
            </span>
          )}
          <Link to="/clientes/novo" className={styles.newBtn}>
            + Novo cliente
          </Link>
        </div>
      </div>

      <div className={styles.searchPanel}>
        <label className={styles.searchLabelNome}>
          Buscar por cliente
          <input
            className={styles.searchInputNome}
            value={nomeSearch.value}
            onChange={(e) => {
              nomeSearch.setValue(e.target.value)
              setClientePorDocumento(null)
              setSearchNotice(null)
            }}
            placeholder="Digite parte do nome"
            autoComplete="off"
          />
          {nomeSearch.isShort && (
            <span className={styles.searchHint}>
              Filtrando na página atual — digite {NOME_BUSCA_MIN_API} ou mais letras para buscar no
              servidor.
            </span>
          )}
          {refreshing && nomeSearch.isServerSearch && (
            <span className={styles.searchHint}>Buscando no servidor…</span>
          )}
        </label>

        <form className={styles.searchFormDocumento} onSubmit={handleBuscarDocumento}>
          <label className={styles.searchLabelTipo}>
            Tipo
            <select
              className={styles.searchSelect}
              value={tipoDocumentoBusca}
              onChange={(e) => {
                setTipoDocumentoBusca(e.target.value as TipoDocumento)
                setDocumentoBusca('')
                setClientePorDocumento(null)
                setSearchNotice(null)
              }}
              disabled={buscandoDocumento}
            >
              {TIPOS_DOCUMENTO.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.searchLabel}>
            Documento
            <input
              className={styles.searchInput}
              value={documentoBusca}
              onChange={(e) => {
                setDocumentoBusca(maskDocumentoInput(tipoDocumentoBusca, e.target.value))
                setClientePorDocumento(null)
              }}
              placeholder={tipoDocumentoBusca === 'CPF' ? '000.000.000-00' : 'Número do documento'}
              inputMode={tipoDocumentoBusca === 'CPF' ? 'numeric' : 'text'}
              maxLength={tipoDocumentoBusca === 'CPF' ? 14 : 30}
              disabled={buscandoDocumento}
            />
          </label>
          <button type="submit" className={styles.searchBtn} disabled={buscandoDocumento}>
            {buscandoDocumento ? 'Buscando…' : 'Buscar'}
          </button>
          {(clientePorDocumento || documentoBusca) && (
            <button type="button" className={styles.clearBtn} onClick={limparBuscaDocumento}>
              Limpar documento
            </button>
          )}
        </form>
      </div>

      <label className={styles.filter}>
        <input
          type="checkbox"
          checked={incluirInativos}
          onChange={(e) => {
            setIncluirInativos(e.target.checked)
            setPageNumber(0)
            setClientePorDocumento(null)
          }}
        />
        Incluir clientes inativos
      </label>

      {initialLoading && <p className={styles.status}>Carregando…</p>}
      {buscandoDocumento && <p className={styles.status}>Buscando documento…</p>}
      {loadError && <p className={styles.error}>{loadError}</p>}
      {searchNotice && <p className={styles.searchNotice}>{searchNotice}</p>}

      {listaPronta && !loadError && (
        <>
          {clientesExibidos.length === 0 ? (
            <p className={styles.status}>
              {clientePorDocumento
                ? 'Nenhum cliente encontrado para este documento.'
                : nomeSearch.isActive
                  ? 'Nenhum cliente encontrado com este nome.'
                  : 'Nenhum cliente encontrado.'}
            </p>
          ) : (
            <>
              <div className={styles.cardList}>
                {clientesExibidos.map((cliente) => (
                  <ClienteCard
                    key={cliente.id}
                    cliente={cliente}
                    incluirInativos={incluirInativos || !!clientePorDocumento}
                    actionId={actionKey as number | null}
                    onInativar={(c) => void handleInativar(c)}
                  />
                ))}
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Documento</th>
                      <th>E-mail</th>
                      <th>Celular</th>
                      {(incluirInativos || clientePorDocumento) && <th>Status</th>}
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesExibidos.map((cliente) => (
                      <ClienteTableRow
                        key={cliente.id}
                        cliente={cliente}
                        incluirInativos={incluirInativos || !!clientePorDocumento}
                        actionId={actionKey as number | null}
                        onInativar={(c) => void handleInativar(c)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!clientePorDocumento && page && (
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
                {page.totalElements === 1 ? 'cliente no total' : 'clientes no total'}
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
    </section>
  )
}
