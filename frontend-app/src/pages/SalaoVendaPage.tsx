import { type FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { buscarProdutoPorCodigoBarras } from '../api/produtos'
import { criarVenda } from '../api/vendas'
import { BarcodeField } from '../components/BarcodeField'
import { ClienteBuscaSection } from '../components/ClienteBuscaSection'
import { useAuth } from '../auth/AuthContext'
import { useClienteBusca, useUnauthorizedHandler } from '../hooks'
import { calcularSubtotalItem, calcularTotalItens, formatPreco } from '../types/venda'
import type { ProdutoComSaldo } from '../utils/produtoEstoque'
import {
  type CartLine,
  clampQuantidade,
  nextCartKey,
  parseQuantidadeInput,
  toItemRequest,
  validarCarrinho,
} from '../utils/carrinhoVenda'
import { getErrorMessage } from '../utils/validation'
import styles from './SalaoVendaPage.module.css'

type BarcodeFeedback = { type: 'ok' | 'error' | 'loading'; message: string }

type VendaRegistrada = {
  id: number
  total: number
  clienteResumo: string
}

export function SalaoVendaPage() {
  const { session } = useAuth()
  const handleUnauthorized = useUnauthorizedHandler()
  const clienteBusca = useClienteBusca()

  const [cart, setCart] = useState<CartLine[]>([])
  const [barcodeFeedback, setBarcodeFeedback] = useState<BarcodeFeedback | null>(null)
  const [buscandoCodigo, setBuscandoCodigo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [ultimoProduto, setUltimoProduto] = useState<{ nome: string; saldo: number } | null>(null)
  const [vendaRegistrada, setVendaRegistrada] = useState<VendaRegistrada | null>(null)

  const itensRequest = useMemo(() => cart.map(toItemRequest), [cart])
  const totalEstimado = useMemo(() => calcularTotalItens(itensRequest), [itensRequest])

  function addProduto(produto: ProdutoComSaldo) {
    setCart((prev) => {
      const existente = prev.find((line) => line.produtoId === produto.id)
      if (existente) {
        const novaQtd = existente.quantidade + 1
        if (novaQtd > produto.saldo) {
          setError(
            `"${produto.nome}": estoque disponível é ${produto.saldo} (não é possível adicionar mais).`,
          )
          return prev
        }
        return prev.map((line) =>
          line.produtoId === produto.id
            ? { ...line, quantidade: novaQtd, saldoMax: produto.saldo }
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
          saldoMax: produto.saldo,
        },
      ]
    })
    setUltimoProduto({ nome: produto.nome, saldo: produto.saldo })
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
      setBarcodeFeedback({
        type: 'ok',
        message: `+1 ${produto.nome} · Estoque disp.: ${produto.saldo}`,
      })
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
        .map((line) => {
          if (line.key !== key) return line
          const quantidade = clampQuantidade(line.quantidade + delta, line.saldoMax)
          return { ...line, quantidade }
        })
        .filter((line) => line.quantidade > 0),
    )
  }

  function setQuantidadeDigitada(key: string, raw: string) {
    setCart((prev) =>
      prev.map((line) =>
        line.key === key
          ? { ...line, quantidade: parseQuantidadeInput(raw, line.saldoMax) }
          : line,
      ),
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

      const clienteResumo =
        clienteBusca.clienteSelecionado?.nomeCompleto ??
        (clienteBusca.nomeOcasional.trim() || 'Consumidor')

      setCart([])
      clienteBusca.reset()
      setUltimoProduto(null)
      setBarcodeFeedback(null)
      setVendaRegistrada({
        id: venda.id,
        total: venda.valorTotal,
        clienteResumo,
      })
    } catch (err) {
      if (handleUnauthorized(err)) return
      setError(getErrorMessage(err, 'Não foi possível registrar a venda.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={styles.page}>
      {vendaRegistrada && (
        <div className={styles.successBanner} role="status">
          <div className={styles.successBannerMain}>
            <p className={styles.successBannerTitle}>
              Venda #{vendaRegistrada.id} registrada
            </p>
            <p className={styles.successBannerText}>
              Envie o cliente ao <strong>caixa</strong> para confirmar o pagamento.
            </p>
            <p className={styles.successBannerMeta}>
              {vendaRegistrada.clienteResumo} · {formatPreco(vendaRegistrada.total)}
            </p>
          </div>
          <div className={styles.successBannerActions}>
            <Link to="/salao/vendas" className={styles.successBannerLink}>
              Ver vendas recentes
            </Link>
            <button
              type="button"
              className={styles.successBannerDismiss}
              onClick={() => setVendaRegistrada(null)}
            >
              Nova venda
            </button>
          </div>
        </div>
      )}

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
            Último: {ultimoProduto.nome} · Estoque disp.: {ultimoProduto.saldo}
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
                  <p className={styles.lineStock}>Estoque disp.: {line.saldoMax}</p>
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
                  <input
                    type="number"
                    className={styles.qtyInput}
                    min={1}
                    max={line.saldoMax}
                    step={1}
                    value={line.quantidade}
                    disabled={submitting}
                    onChange={(e) => setQuantidadeDigitada(line.key, e.target.value)}
                    aria-label={`Quantidade de ${line.produtoNome}`}
                  />
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    disabled={submitting || line.quantidade >= line.saldoMax}
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
