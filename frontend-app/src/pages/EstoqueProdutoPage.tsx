import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import {
  listarHistorico,
  obterSaldo,
  registrarEntrada,
  registrarSaida,
} from '../api/estoque'
import { buscarProduto } from '../api/produtos'
import { useAuth } from '../auth/AuthContext'
import type { MovimentacaoEstoque, Page } from '../types/estoque'
import type { Produto } from '../types/produto'
import { getErrorMessage } from '../utils/validation'
import styles from './EstoqueProdutoPage.module.css'

type MovimentacaoTipo = 'ENTRADA' | 'SAIDA'

interface MovimentacaoFormState {
  quantidade: string
  justificativa: string
}

const INITIAL_FORM: MovimentacaoFormState = {
  quantidade: '',
  justificativa: '',
}

function formatDataHora(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function TipoBadge({ tipo }: { tipo: MovimentacaoEstoque['tipo'] }) {
  return (
    <span className={tipo === 'ENTRADA' ? styles.badgeEntrada : styles.badgeSaida}>
      {tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}
    </span>
  )
}

export function EstoqueProdutoPage() {
  const { produtoId } = useParams()
  const id = Number(produtoId)
  const { session, logout } = useAuth()

  const [produto, setProduto] = useState<Produto | null>(null)
  const [saldo, setSaldo] = useState<number | null>(null)
  const [historico, setHistorico] = useState<Page<MovimentacaoEstoque> | null>(null)
  const [pageNumber, setPageNumber] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [tipoAtivo, setTipoAtivo] = useState<MovimentacaoTipo>('ENTRADA')
  const [form, setForm] = useState<MovimentacaoFormState>(INITIAL_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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

  const loadProduto = useCallback(async () => {
    if (!session || !Number.isFinite(id)) return

    setLoading(true)
    setLoadError(null)

    try {
      const produtoData = await buscarProduto(session.token, id)
      setProduto(produtoData)
    } catch (err) {
      if (handleUnauthorized(err)) return
      setLoadError(getErrorMessage(err, 'Erro ao carregar produto.'))
    } finally {
      setLoading(false)
    }
  }, [session, id, handleUnauthorized])

  const loadSaldoEHistorico = useCallback(async () => {
    if (!session || !Number.isFinite(id)) return

    setRefreshing(true)

    try {
      const [saldoData, historicoData] = await Promise.all([
        obterSaldo(session.token, id),
        listarHistorico(session.token, id, { page: pageNumber }),
      ])
      setSaldo(saldoData)
      setHistorico(historicoData)
    } catch (err) {
      if (handleUnauthorized(err)) return
      setLoadError(getErrorMessage(err, 'Erro ao carregar dados de estoque.'))
    } finally {
      setRefreshing(false)
    }
  }, [session, id, pageNumber, handleUnauthorized])

  useEffect(() => {
    setProduto(null)
    setSaldo(null)
    setHistorico(null)
    setPageNumber(0)
    void loadProduto()
  }, [loadProduto])

  useEffect(() => {
    if (!produto) return
    void loadSaldoEHistorico()
  }, [produto, loadSaldoEHistorico])

  async function handleMovimentacao(event: FormEvent) {
    event.preventDefault()
    if (!session || !produto) return

    const quantidade = Number.parseInt(form.quantidade, 10)
    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      setFormError('Informe uma quantidade maior que zero.')
      return
    }

    setSubmitting(true)
    setFormError(null)

    const payload = {
      produtoId: produto.id,
      quantidade,
      justificativa: form.justificativa.trim() || null,
    }

    try {
      if (tipoAtivo === 'ENTRADA') {
        await registrarEntrada(session.token, payload)
      } else {
        await registrarSaida(session.token, payload)
      }

      setForm(INITIAL_FORM)
      setPageNumber(0)
      const [saldoData, historicoData] = await Promise.all([
        obterSaldo(session.token, produto.id),
        listarHistorico(session.token, produto.id, { page: 0 }),
      ])
      setSaldo(saldoData)
      setHistorico(historicoData)
    } catch (err) {
      if (handleUnauthorized(err)) return
      setFormError(getErrorMessage(err, 'Não foi possível registrar a movimentação.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!Number.isFinite(id)) {
    return (
      <section className={styles.page}>
        <p className={styles.error}>Produto inválido.</p>
        <Link to="/estoque" className={styles.backLink}>
          ← Voltar ao estoque
        </Link>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <Link to="/estoque" className={styles.backLink}>
        ← Voltar ao estoque
      </Link>

      {loading && <p className={styles.status}>Carregando…</p>}
      {loadError && <p className={styles.error}>{loadError}</p>}

      {produto && !loadError && (
        <>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>{produto.nome}</h1>
              <p className={styles.subtitle}>
                <span className={styles.mono}>{produto.codigoBarras}</span>
                {' · '}
                {produto.categoria}
              </p>
            </div>
            <div className={styles.saldoCard}>
              <span className={styles.saldoLabel}>Saldo atual</span>
              <strong className={styles.saldoValue}>
                {saldo === null ? '…' : saldo}
              </strong>
              {refreshing && <span className={styles.refreshHint}>Atualizando…</span>}
            </div>
          </header>

          {produto.tipoProduto === 'PACOTE' ? (
            <div className={styles.kitNotice}>
              <p>
                Este produto é um <strong>kit (pacote)</strong>. No OmniCore, o estoque físico fica nos{' '}
                <strong>produtos unitários</strong> que compõem o kit — na venda, a baixa é feita nos
                componentes, não neste item.
              </p>
              <p>
                Para repor estoque, movimente cada unitário na tela de Estoque. Para montar a receita
                do kit, use a composição em Produtos.
              </p>
              <Link to={`/produtos/${produto.id}/kit`} className={styles.kitLink}>
                Abrir composição do kit →
              </Link>
            </div>
          ) : (
            <>
          {!produto.ativo && (
            <p className={styles.warning}>
              Produto inativo — movimentações manuais não são permitidas pela API.
            </p>
          )}

          <div className={styles.grid}>
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Movimentação manual</h2>
              <div className={styles.tabs}>
                <button
                  type="button"
                  className={tipoAtivo === 'ENTRADA' ? styles.tabActive : styles.tab}
                  onClick={() => {
                    setTipoAtivo('ENTRADA')
                    setFormError(null)
                  }}
                >
                  Entrada
                </button>
                <button
                  type="button"
                  className={tipoAtivo === 'SAIDA' ? styles.tabActive : styles.tab}
                  onClick={() => {
                    setTipoAtivo('SAIDA')
                    setFormError(null)
                  }}
                >
                  Saída
                </button>
              </div>

              <form className={styles.form} onSubmit={(e) => void handleMovimentacao(e)}>
                <label className={styles.field}>
                  Quantidade
                  <input
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    className={styles.input}
                    value={form.quantidade}
                    onChange={(e) => setForm((prev) => ({ ...prev, quantidade: e.target.value }))}
                    placeholder="Ex.: 10"
                    disabled={!produto.ativo || submitting}
                    required
                  />
                </label>

                <label className={styles.field}>
                  Justificativa <span className={styles.optional}>(opcional)</span>
                  <textarea
                    className={styles.textarea}
                    value={form.justificativa}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, justificativa: e.target.value }))
                    }
                    placeholder={
                      tipoAtivo === 'ENTRADA'
                        ? 'Ex.: Reposição do fornecedor'
                        : 'Ex.: Avaria / perda'
                    }
                    rows={3}
                    maxLength={255}
                    disabled={!produto.ativo || submitting}
                  />
                </label>

                {formError && <p className={styles.formError}>{formError}</p>}

                <button
                  type="submit"
                  className={tipoAtivo === 'ENTRADA' ? styles.submitEntrada : styles.submitSaida}
                  disabled={!produto.ativo || submitting}
                >
                  {submitting
                    ? 'Registrando…'
                    : tipoAtivo === 'ENTRADA'
                      ? 'Registrar entrada'
                      : 'Registrar saída'}
                </button>
              </form>
            </section>

            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Histórico de movimentações</h2>

              {!historico || historico.empty ? (
                <p className={styles.status}>Nenhuma movimentação registrada ainda.</p>
              ) : (
                <>
                  <div className={styles.historicoList}>
                    {historico.content.map((mov) => (
                      <article key={mov.id} className={styles.historicoCard}>
                        <div className={styles.historicoTop}>
                          <TipoBadge tipo={mov.tipo} />
                          <span className={styles.historicoQtd}>
                            {mov.tipo === 'ENTRADA' ? '+' : '−'}
                            {mov.quantidade}
                          </span>
                        </div>
                        <p className={styles.historicoData}>{formatDataHora(mov.dataHora)}</p>
                        {mov.justificativa && (
                          <p className={styles.historicoJustificativa}>{mov.justificativa}</p>
                        )}
                        {mov.vendaId && (
                          <p className={styles.historicoVenda}>Venda #{mov.vendaId}</p>
                        )}
                      </article>
                    ))}
                  </div>

                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Tipo</th>
                          <th>Qtd</th>
                          <th>Justificativa</th>
                          <th>Venda</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historico.content.map((mov) => (
                          <tr key={mov.id}>
                            <td className={styles.nowrap}>{formatDataHora(mov.dataHora)}</td>
                            <td>
                              <TipoBadge tipo={mov.tipo} />
                            </td>
                            <td className={styles.qtdCell}>
                              {mov.tipo === 'ENTRADA' ? '+' : '−'}
                              {mov.quantidade}
                            </td>
                            <td>{mov.justificativa ?? '—'}</td>
                            <td>{mov.vendaId ? `#${mov.vendaId}` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.pagination}>
                    {historico.totalPages > 1 && (
                      <button
                        type="button"
                        disabled={historico.first}
                        onClick={() => setPageNumber((n) => n - 1)}
                      >
                        Anterior
                      </button>
                    )}
                    <span className={styles.paginationInfo}>
                      Página {historico.number + 1} de {historico.totalPages}
                      {' · '}
                      {historico.totalElements}{' '}
                      {historico.totalElements === 1 ? 'movimentação' : 'movimentações'}
                    </span>
                    {historico.totalPages > 1 && (
                      <button
                        type="button"
                        disabled={historico.last}
                        onClick={() => setPageNumber((n) => n + 1)}
                      >
                        Próxima
                      </button>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
            </>
          )}
        </>
      )}
    </section>
  )
}
