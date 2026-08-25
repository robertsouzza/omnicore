import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listarProdutos } from '../api/produtos'
import { criarVenda } from '../api/vendas'
import { ClienteBuscaSection } from '../components/ClienteBuscaSection'
import { useAuth } from '../auth/AuthContext'
import { useClienteBusca, useDebouncedSearch, useUnauthorizedHandler } from '../hooks'
import type { StatusVenda } from '../types/venda'
import {
  STATUS_NOVA_VENDA,
  calcularSubtotalItem,
  calcularTotalItens,
  formatPreco,
} from '../types/venda'
import type { ProdutoComSaldo } from '../utils/produtoEstoque'
import { filtrarProdutosComSaldoPositivo, rotuloSaldoProduto } from '../utils/produtoEstoque'
import { onlyDigits } from '../utils/strings'
import { getErrorMessage } from '../utils/validation'
import styles from './NovaVendaPage.module.css'

import {
  type CartLine,
  nextCartKey,
  toItemRequest,
  validarCarrinho,
} from '../utils/carrinhoVenda'

const BUSCA_MIN_API = 3

export function NovaVendaPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const handleUnauthorized = useUnauthorizedHandler()
  const clienteBusca = useClienteBusca()

  const [status, setStatus] = useState<StatusVenda>('PENDENTE')
  const produtoSearch = useDebouncedSearch({ minLength: BUSCA_MIN_API })
  const [produtosSugeridos, setProdutosSugeridos] = useState<ProdutoComSaldo[]>([])
  const [buscandoProdutos, setBuscandoProdutos] = useState(false)
  const [produtoNotice, setProdutoNotice] = useState<string | null>(null)

  const [cart, setCart] = useState<CartLine[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!session || produtoSearch.debouncedValue.length < BUSCA_MIN_API) {
      setProdutosSugeridos([])
      setProdutoNotice(null)
      return
    }

    let cancelled = false
    setBuscandoProdutos(true)
    setProdutoNotice(null)

    void (async () => {
      try {
        const trimmed = produtoSearch.debouncedValue.trim()
        const digits = onlyDigits(trimmed)
        const buscaPorCodigo = digits.length >= BUSCA_MIN_API && /^\d+$/.test(trimmed)

        const data = await listarProdutos(session.token, {
          page: 0,
          size: 20,
          nome: buscaPorCodigo ? undefined : produtoSearch.debouncedValue,
          codigoBarras: buscaPorCodigo ? digits : undefined,
        })

        const comEstoque = await filtrarProdutosComSaldoPositivo(session.token, data.content)

        if (cancelled) return

        setProdutosSugeridos(comEstoque.slice(0, 8))
        if (data.content.length > 0 && comEstoque.length === 0) {
          setProdutoNotice('Produtos encontrados, mas nenhum com estoque disponível (> 0).')
        } else if (data.content.length === 0) {
          setProdutoNotice('Nenhum produto encontrado para a busca informada.')
        }
      } catch (err) {
        if (handleUnauthorized(err)) return
        if (!cancelled) {
          setProdutosSugeridos([])
          setProdutoNotice(getErrorMessage(err, 'Erro ao buscar produtos.'))
        }
      } finally {
        if (!cancelled) setBuscandoProdutos(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [session, produtoSearch.debouncedValue, handleUnauthorized])

  const itensRequest = useMemo(() => cart.map(toItemRequest), [cart])
  const totalEstimado = useMemo(() => calcularTotalItens(itensRequest), [itensRequest])

  const statusHint = STATUS_NOVA_VENDA.find((s) => s.value === status)?.hint ?? ''

  function addProduto(produto: ProdutoComSaldo) {
    setCart((prev) => [
      ...prev,
      {
        key: nextCartKey(),
        produtoId: produto.id,
        produtoNome: produto.nome,
        quantidade: 1,
        precoUnitario: produto.precoVenda,
        desconto: 0,
      },
    ])
    produtoSearch.setValue('')
    setProdutosSugeridos([])
    setProdutoNotice(null)
    setError(null)
  }

  function updateLine(key: string, patch: Partial<CartLine>) {
    setCart((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)))
  }

  function removeLine(key: string) {
    setCart((prev) => prev.filter((line) => line.key !== key))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!session) return

    const validationError = validarCarrinho(cart)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const venda = await criarVenda(session.token, {
        status,
        vendedorId: session.colaboradorId,
        clienteId: clienteBusca.clienteSelecionado?.id ?? null,
        nomeClienteOcasional:
          !clienteBusca.clienteSelecionado && clienteBusca.nomeOcasional.trim()
            ? clienteBusca.nomeOcasional.trim()
            : null,
        itens: itensRequest,
      })
      navigate(`/vendas/${venda.id}`)
    } catch (err) {
      if (handleUnauthorized(err)) return
      setError(getErrorMessage(err, 'Não foi possível registrar a venda.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={styles.page}>
      <Link to="/vendas" className={styles.backLink}>
        ← Voltar às vendas
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>Nova venda</h1>
        <p className={styles.subtitle}>Monte o carrinho e registre o pedido</p>
      </header>

      <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Dados do pedido</h2>

          <label className={styles.field}>
            Status inicial
            <select
              className={styles.select}
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusVenda)}
              disabled={submitting}
            >
              {STATUS_NOVA_VENDA.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          {statusHint && <p className={styles.hint}>{statusHint}</p>}

          <label className={styles.field}>
            Vendedor
            <input className={styles.input} value={session?.nome ?? ''} disabled readOnly />
          </label>

          <ClienteBuscaSection busca={clienteBusca} disabled={submitting} />
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Produtos</h2>

          <label className={styles.field}>
            Buscar produto
            <input
              className={styles.input}
              value={produtoSearch.value}
              onChange={(e) => {
                produtoSearch.setValue(e.target.value)
                setProdutoNotice(null)
              }}
              placeholder="Nome ou código de barras (3+ caracteres)"
              disabled={submitting}
              autoComplete="off"
            />
          </label>
          <p className={styles.hint}>
            Somente produtos disponíveis para venda: unitários com estoque &gt; 0; pacotes
            (kits) conforme estoque dos componentes.
          </p>
          {buscandoProdutos && <p className={styles.hint}>Buscando produtos…</p>}
          {produtoNotice && !buscandoProdutos && <p className={styles.notice}>{produtoNotice}</p>}

          {produtosSugeridos.length > 0 && (
            <ul className={styles.suggestions}>
              {produtosSugeridos.map((produto) => (
                <li key={produto.id}>
                  <button
                    type="button"
                    className={styles.suggestionBtn}
                    onClick={() => addProduto(produto)}
                  >
                    <span>{produto.nome}</span>
                    <span className={styles.suggestionMeta}>
                      {rotuloSaldoProduto(produto)} · {formatPreco(produto.precoVenda)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {cart.length === 0 ? (
            <p className={styles.emptyCart}>Nenhum item no carrinho.</p>
          ) : (
            <div className={styles.cart}>
              {cart.map((line) => (
                <article key={line.key} className={styles.cartLine}>
                  <div className={styles.cartLineTop}>
                    <strong>{line.produtoNome}</strong>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeLine(line.key)}
                      disabled={submitting}
                    >
                      Remover
                    </button>
                  </div>
                  <div className={styles.cartFields}>
                    <label>
                      Qtd
                      <input
                        type="number"
                        min={1}
                        step={1}
                        className={styles.inputSmall}
                        value={line.quantidade}
                        onChange={(e) =>
                          updateLine(line.key, {
                            quantidade: Number.parseInt(e.target.value, 10) || 1,
                          })
                        }
                        disabled={submitting}
                      />
                    </label>
                    <label>
                      Preço un.
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className={styles.inputSmall}
                        value={line.precoUnitario}
                        onChange={(e) =>
                          updateLine(line.key, {
                            precoUnitario: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                        disabled={submitting}
                      />
                    </label>
                    <label>
                      Desconto
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className={styles.inputSmall}
                        value={line.desconto}
                        onChange={(e) =>
                          updateLine(line.key, {
                            desconto: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                        disabled={submitting}
                      />
                    </label>
                    <div className={styles.subtotal}>
                      <span>Subtotal</span>
                      <strong>{formatPreco(calcularSubtotalItem(toItemRequest(line)))}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className={styles.totalBar}>
            <span>Total estimado</span>
            <strong>{formatPreco(totalEstimado)}</strong>
          </div>
        </section>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.submitBtn} disabled={submitting || cart.length === 0}>
          {submitting ? 'Registrando venda…' : 'Registrar venda'}
        </button>
      </form>
    </section>
  )
}
