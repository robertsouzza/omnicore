import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { adicionarComponente, listarComposicao, removerComponente } from '../api/composicao'
import { listarProdutos } from '../api/produtos'
import type { ComposicaoPacote } from '../types/composicao'
import type { Produto } from '../types/produto'
import { getErrorMessage, getFieldErrors } from '../utils/validation'
import styles from './ComposicaoPacoteSection.module.css'

interface ComposicaoPacoteSectionProps {
  pacoteId: number
  token: string
  onUnauthorized: (err: unknown) => boolean
  hideHeader?: boolean
}

export function ComposicaoPacoteSection({
  pacoteId,
  token,
  onUnauthorized,
  hideHeader = false,
}: ComposicaoPacoteSectionProps) {
  const [composicao, setComposicao] = useState<ComposicaoPacote[]>([])
  const [unitarios, setUnitarios] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [produtoFilhoId, setProdutoFilhoId] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [itens, produtosPage] = await Promise.all([
        listarComposicao(token, pacoteId),
        listarProdutos(token, { size: 100 }),
      ])

      setComposicao(itens)
      setUnitarios(
        produtosPage.content.filter(
          (p) => p.tipoProduto === 'UNITARIO' && p.ativo && p.id !== pacoteId,
        ),
      )
    } catch (err) {
      if (onUnauthorized(err)) return
      setError(getErrorMessage(err, 'Erro ao carregar composição do pacote.'))
    } finally {
      setLoading(false)
    }
  }, [token, pacoteId, onUnauthorized])

  useEffect(() => {
    void load()
  }, [load])

  async function handleAdicionar(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setSubmitting(true)

    try {
      await adicionarComponente(token, pacoteId, {
        produtoFilhoId: Number(produtoFilhoId),
        quantidade: Number(quantidade),
      })
      setProdutoFilhoId('')
      setQuantidade('1')
      await load()
    } catch (err) {
      if (onUnauthorized(err)) return
      setFieldErrors(getFieldErrors(err))
      setError(getErrorMessage(err, 'Não foi possível adicionar o componente.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemover(item: ComposicaoPacote) {
    const confirmed = window.confirm(
      `Remover "${item.produtoFilho.nome}" da composição?\n\nEssa ação não afeta vendas já registradas.`,
    )
    if (!confirmed) return

    setRemovingId(item.id)
    setError(null)

    try {
      await removerComponente(token, pacoteId, item.id)
      await load()
    } catch (err) {
      if (onUnauthorized(err)) return
      setError(getErrorMessage(err, 'Não foi possível remover o componente.'))
    } finally {
      setRemovingId(null)
    }
  }

  const idsNaComposicao = new Set(composicao.map((c) => c.produtoFilho.id))
  const opcoesFilho = unitarios.filter((p) => !idsNaComposicao.has(p.id))

  return (
    <section className={styles.section}>
      {!hideHeader && (
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Composição do kit</h2>
          <p className={styles.sectionSubtitle}>
            Produtos unitários consumidos por cada unidade vendida deste pacote.
          </p>
        </div>
      )}

      {loading && <p className={styles.status}>Carregando composição…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && (
        <>
          <form className={styles.addForm} onSubmit={handleAdicionar}>
            <label className={styles.label}>
              Produto unitário *
              <select
                className={fieldErrors.produtoFilhoId ? styles.inputError : styles.input}
                value={produtoFilhoId}
                onChange={(e) => setProdutoFilhoId(e.target.value)}
                required
                disabled={submitting || opcoesFilho.length === 0}
              >
                <option value="">
                  {opcoesFilho.length === 0
                    ? 'Nenhum unitário disponível'
                    : 'Selecione um produto…'}
                </option>
                {opcoesFilho.map((produto) => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome} ({produto.codigoBarras})
                  </option>
                ))}
              </select>
              {fieldErrors.produtoFilhoId && (
                <span className={styles.fieldError}>{fieldErrors.produtoFilhoId}</span>
              )}
            </label>

            <label className={styles.label}>
              Quantidade *
              <input
                type="number"
                step="0.001"
                min="0.001"
                className={fieldErrors.quantidade ? styles.inputError : styles.input}
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                required
                disabled={submitting}
              />
              {fieldErrors.quantidade && (
                <span className={styles.fieldError}>{fieldErrors.quantidade}</span>
              )}
            </label>

            <button
              type="submit"
              className={styles.addBtn}
              disabled={submitting || opcoesFilho.length === 0}
            >
              {submitting ? 'Adicionando…' : '+ Adicionar'}
            </button>
          </form>

          {composicao.length === 0 ? (
            <p className={styles.empty}>Nenhum componente no kit. Adicione produtos unitários acima.</p>
          ) : (
            <>
              <div className={styles.cardList}>
                {composicao.map((item) => (
                  <article key={item.id} className={styles.card}>
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle}>{item.produtoFilho.nome}</h3>
                      <p className={styles.cardMeta}>
                        Código: {item.produtoFilho.codigoBarras}
                      </p>
                      <p className={styles.cardQty}>Qtd: {item.quantidade}</p>
                    </div>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      disabled={removingId === item.id}
                      onClick={() => void handleRemover(item)}
                    >
                      {removingId === item.id ? 'Removendo…' : 'Remover'}
                    </button>
                  </article>
                ))}
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Código</th>
                      <th>Quantidade</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {composicao.map((item) => (
                      <tr key={item.id}>
                        <td>{item.produtoFilho.nome}</td>
                        <td className={styles.mono}>{item.produtoFilho.codigoBarras}</td>
                        <td>{item.quantidade}</td>
                        <td>
                          <button
                            type="button"
                            className={styles.removeBtn}
                            disabled={removingId === item.id}
                            onClick={() => void handleRemover(item)}
                          >
                            {removingId === item.id ? 'Removendo…' : 'Remover'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}
