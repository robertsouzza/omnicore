import { type FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buscarProdutoPorCodigoBarras } from '../api/produtos'
import { criarVenda } from '../api/vendas'
import { BarcodeField } from '../components/BarcodeField'
import { ClienteBuscaSection } from '../components/ClienteBuscaSection'
import { useAuth } from '../auth/AuthContext'
import { useClienteBusca, useUnauthorizedHandler } from '../hooks'
import { calcularSubtotalItem, calcularTotalItens, formatPreco } from '../types/venda'
import {
  type CartLine,
  nextCartKey,
  toItemRequest,
  validarCarrinho,
} from '../utils/carrinhoVenda'
import { getErrorMessage } from '../utils/validation'
import styles from './SalaoVendaPage.module.css'

type BarcodeFeedback = { type: 'ok' | 'error' | 'loading'; message: string }

export function SalaoVendaPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const handleUnauthorized = useUnauthorizedHandler()
  const clienteBusca = useClienteBusca()

  const [cart, setCart] = useState<CartLine[]>([])
  const [barcodeFeedback, setBarcodeFeedback] = useState<BarcodeFeedback | null>(null)
  const [buscandoCodigo, setBuscandoCodigo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [ultimoProduto, setUltimoProduto] = useState<string | null>(null)

  const itensRequest = useMemo(() => cart.map(toItemRequest), [cart])
  const totalEstimado = useMemo(() => calcularTotalItens(itensRequest), [itensRequest])

  function addProduto(produto: { id: number; nome: string; precoVenda: number }) {
    setCart((prev) => {
      const existente = prev.find((line) => line.produtoId === produto.id)
      if (existente) {
        return prev.map((line) =>
          line.produtoId === produto.id
            ? { ...line, quantidade: line.quantidade + 1 }
            : line,
        )
      }
      return [
        ...prev,
        {
          key: nextCartKey(),
          produtoId: produto.id,
          produtoNome: produto.nome,
          quantidade: 1,
          precoUnitario: produto.precoVenda,
          desconto: 0,
        },
      ]
    })
    setUltimoProduto(produto.nome)
    setError(null)
  }

  async function handleBarcode(code: string) {
    if (!session) return

    setBuscandoCodigo(true)
    setBarcodeFeedback({ type: 'loading', message: 'Buscando produto…' })
    setError(null)

    try {
      const produto = await buscarProdutoPorCodigoBarras(session.token, code)
      if (!produto) {
        setBarcodeFeedback({
          type: 'error',
          message: 'Produto não encontrado ou sem estoque disponível.',
        })
        return
      }

      addProduto(produto)
      setBarcodeFeedback({ type: 'ok', message: `+1 ${produto.nome}` })
    } catch (err) {
      if (handleUnauthorized(err)) return
      setBarcodeFeedback({
        type: 'error',
        message: getErrorMessage(err, 'Erro ao buscar produto.'),
      })
    } finally {
      setBuscandoCodigo(false)
    }
  }

  function updateQuantidade(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((line) =>
          line.key === key ? { ...line, quantidade: line.quantidade + delta } : line,
        )
        .filter((line) => line.quantidade > 0),
    )
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
        status: 'PENDENTE',
        vendedorId: session.colaboradorId,
        clienteId: clienteBusca.clienteSelecionado?.id ?? null,
        nomeClienteOcasional:
          !clienteBusca.clienteSelecionado && clienteBusca.nomeOcasional.trim()
            ? clienteBusca.nomeOcasional.trim()
            : null,
        itens: itensRequest,
      })
      setCart([])
      clienteBusca.reset()
      setUltimoProduto(null)
      setBarcodeFeedback(null)
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
      <header>
        <h1 className={styles.title}>Venda rápida</h1>
        <p className={styles.subtitle}>Escaneie ou digite o código de barras</p>
      </header>

      <div className={styles.panel}>
        <BarcodeField
          disabled={submitting}
          loading={buscandoCodigo}
          feedback={barcodeFeedback}
          onSubmitCode={handleBarcode}
        />
        {ultimoProduto && (
          <p className={styles.successToast} role="status">
            Último: {ultimoProduto}
          </p>
        )}
      </div>

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Carrinho ({cart.length})</h2>
        {cart.length === 0 ? (
          <p className={styles.emptyCart}>Nenhum item — escaneie um produto para começar.</p>
        ) : (
          <div className={styles.cartList}>
            {cart.map((line) => (
              <article key={line.key} className={styles.cartLine}>
                <div className={styles.lineInfo}>
                  <p className={styles.lineName}>{line.produtoNome}</p>
                  <p className={styles.linePrice}>
                    {formatPreco(line.precoUnitario)} · subtotal{' '}
                    {formatPreco(calcularSubtotalItem(toItemRequest(line)))}
                  </p>
                </div>
                <div className={styles.qtyRow}>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    disabled={submitting}
                    onClick={() => updateQuantidade(line.key, -1)}
                    aria-label="Diminuir quantidade"
                  >
                    −
                  </button>
                  <span className={styles.qtyValue}>{line.quantidade}</span>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    disabled={submitting}
                    onClick={() => updateQuantidade(line.key, 1)}
                    aria-label="Aumentar quantidade"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className={styles.removeBtn}
                  disabled={submitting}
                  onClick={() => removeLine(line.key)}
                >
                  Remover
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Cliente</h2>
        <ClienteBuscaSection busca={clienteBusca} disabled={submitting} />
        <p className={styles.hint}>
          Vendas do salão são registradas como <strong>PENDENTE</strong> (caixa confirma depois).
        </p>
      </div>

      <div className={styles.totalBar}>
        <span>Total</span>
        <strong>{formatPreco(totalEstimado)}</strong>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <form onSubmit={(e) => void handleSubmit(e)}>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={submitting || cart.length === 0}
        >
          {submitting ? 'Registrando…' : 'Registrar venda'}
        </button>
      </form>
    </section>
  )
}
