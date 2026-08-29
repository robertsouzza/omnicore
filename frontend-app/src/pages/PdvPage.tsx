import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { buscarProdutoPorCodigoBarras } from '../api/produtos'
import { criarVenda } from '../api/vendas'
import { BarcodeField } from '../components/BarcodeField'
import { ClienteBuscaSection } from '../components/ClienteBuscaSection'
import { PdvCupomPreview } from '../components/pdv/PdvCupomPreview'
import {
  PdvProdutoPreview,
  type PdvProdutoPreviewData,
} from '../components/pdv/PdvProdutoPreview'
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
import barcodeStyles from '../components/BarcodeField.module.css'
import styles from './PdvPage.module.css'

type BarcodeFeedback = { type: 'ok' | 'error' | 'loading'; message: string }

type VendaFinalizada = {
  id: number
  total: number
  clienteResumo: string
}

type PdvCartLine = CartLine & {
  urlImagem: string | null
  codigoBarras: string
}

const PDV_BARCODE_INPUT_ID = 'pdv-barcode-input'

function lineToPreview(line: PdvCartLine): PdvProdutoPreviewData {
  return {
    nome: line.produtoNome,
    urlImagem: line.urlImagem,
    codigoBarras: line.codigoBarras,
    precoVenda: line.precoUnitario,
    saldo: line.saldoMax,
  }
}

export function PdvPage() {
  const { session } = useAuth()
  const handleUnauthorized = useUnauthorizedHandler()
  const clienteBusca = useClienteBusca()
  const {
    clienteSelecionado,
    nomeOcasional,
    reset: resetCliente,
  } = clienteBusca

  const [cart, setCart] = useState<PdvCartLine[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [barcodeFeedback, setBarcodeFeedback] = useState<BarcodeFeedback | null>(null)
  const [buscandoCodigo, setBuscandoCodigo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [produtoPreview, setProdutoPreview] = useState<PdvProdutoPreviewData | null>(null)
  const [vendaFinalizada, setVendaFinalizada] = useState<VendaFinalizada | null>(null)
  const [clienteAberto, setClienteAberto] = useState(false)

  const finalizeFormRef = useRef<HTMLFormElement>(null)

  const itensRequest = useMemo(() => cart.map(toItemRequest), [cart])
  const totalEstimado = useMemo(() => calcularTotalItens(itensRequest), [itensRequest])

  const clienteResumo = useMemo(() => {
    if (clienteSelecionado) return clienteSelecionado.nomeCompleto
    const ocasional = nomeOcasional.trim()
    return ocasional || null
  }, [clienteSelecionado, nomeOcasional])

  const focusBarcode = useCallback(() => {
    document.getElementById(PDV_BARCODE_INPUT_ID)?.focus()
  }, [])

  function addProduto(produto: ProdutoComSaldo) {
    let newKey: string | null = null
    const preview: PdvProdutoPreviewData = {
      nome: produto.nome,
      urlImagem: produto.urlImagem,
      codigoBarras: produto.codigoBarras,
      precoVenda: produto.precoVenda,
      saldo: produto.saldo,
    }

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
        newKey = existente.key
        return prev.map((line) =>
          line.produtoId === produto.id
            ? {
                ...line,
                quantidade: novaQtd,
                saldoMax: produto.saldo,
                urlImagem: produto.urlImagem,
                codigoBarras: produto.codigoBarras,
              }
            : line,
        )
      }
      newKey = nextCartKey()
      return [
        ...prev,
        {
          key: newKey,
          produtoId: produto.id,
          produtoNome: produto.nome,
          quantidade: 1,
          precoUnitario: produto.precoVenda,
          desconto: 0,
          saldoMax: produto.saldo,
          urlImagem: produto.urlImagem,
          codigoBarras: produto.codigoBarras,
        },
      ]
    })

    if (newKey) setSelectedKey(newKey)
    setProdutoPreview({ ...preview, saldo: produto.saldo })
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
      focusBarcode()
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

  function selectLine(line: PdvCartLine) {
    setSelectedKey(line.key)
    setProdutoPreview(lineToPreview(line))
  }

  function removeLine(key: string) {
    setCart((prev) => prev.filter((line) => line.key !== key))
    setSelectedKey((prev) => (prev === key ? null : prev))
  }

  const cartLengthRef = useRef(cart.length)
  cartLengthRef.current = cart.length

  const novaVenda = useCallback(() => {
    if (
      cartLengthRef.current > 0 &&
      !window.confirm('Descartar itens do carrinho e iniciar nova venda?')
    ) {
      return
    }
    setCart([])
    setSelectedKey(null)
    setError(null)
    setBarcodeFeedback(null)
    setProdutoPreview(null)
    setVendaFinalizada(null)
    resetCliente()
    setClienteAberto(false)
    focusBarcode()
  }, [resetCliente, focusBarcode])

  const finalizarVenda = useCallback(async () => {
    if (!session || submitting || cart.length === 0) return

    const validationError = validarCarrinho(cart)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const venda = await criarVenda(session.token, {
        status: 'PAGA',
        vendedorId: session.colaboradorId,
        clienteId: clienteSelecionado?.id ?? null,
        nomeClienteOcasional:
          !clienteSelecionado && nomeOcasional.trim() ? nomeOcasional.trim() : null,
        itens: itensRequest,
      })

      const clienteResumo =
        clienteSelecionado?.nomeCompleto ?? (nomeOcasional.trim() || 'Consumidor')

      setCart([])
      setSelectedKey(null)
      resetCliente()
      setClienteAberto(false)
      setProdutoPreview(null)
      setBarcodeFeedback(null)
      setVendaFinalizada({
        id: venda.id,
        total: venda.valorTotal,
        clienteResumo,
      })
      focusBarcode()
    } catch (err) {
      if (handleUnauthorized(err)) return
      setError(getErrorMessage(err, 'Não foi possível finalizar a venda.'))
    } finally {
      setSubmitting(false)
    }
  }, [
    session,
    submitting,
    cart,
    clienteSelecionado,
    nomeOcasional,
    resetCliente,
    itensRequest,
    handleUnauthorized,
    focusBarcode,
  ])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await finalizarVenda()
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (submitting) return

      switch (event.key) {
        case 'F3': {
          event.preventDefault()
          if (selectedKey) removeLine(selectedKey)
          focusBarcode()
          break
        }
        case 'F4': {
          event.preventDefault()
          if (selectedKey) {
            document
              .querySelector<HTMLInputElement>(`[data-pdv-qty="${selectedKey}"]`)
              ?.focus()
          }
          break
        }
        case 'F5': {
          event.preventDefault()
          novaVenda()
          break
        }
        case 'F10': {
          event.preventDefault()
          if (cart.length > 0) void finalizarVenda()
          break
        }
        default:
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedKey, submitting, cart.length, finalizarVenda, focusBarcode, novaVenda])

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>PDV — Caixa</h1>
          <p className={styles.subtitle}>Bip contínuo · venda paga na hora</p>
        </div>
        <p className={styles.shortcuts} aria-label="Atalhos de teclado">
          <kbd>F3</kbd> excluir · <kbd>F4</kbd> qtd · <kbd>F5</kbd> nova · <kbd>F10</kbd>{' '}
          finalizar
        </p>
      </header>

      {vendaFinalizada && (
        <div className={styles.successBanner} role="status">
          <div className={styles.successBannerMain}>
            <p className={styles.successBannerTitle}>Venda #{vendaFinalizada.id} paga</p>
            <p className={styles.successBannerText}>
              Estoque baixado · pronta para o próximo cliente.
            </p>
            <p className={styles.successBannerMeta}>
              {vendaFinalizada.clienteResumo} · {formatPreco(vendaFinalizada.total)}
            </p>
          </div>
          <div className={styles.successBannerActions}>
            <Link to={`/vendas/${vendaFinalizada.id}`} className={styles.successBannerLink}>
              Ver detalhe
            </Link>
            <button
              type="button"
              className={styles.successBannerDismiss}
              onClick={() => {
                setVendaFinalizada(null)
                focusBarcode()
              }}
            >
              Nova venda (F5)
            </button>
          </div>
        </div>
      )}

      <div className={styles.workspace}>
        <PdvProdutoPreview produto={produtoPreview} />

        <div className={styles.centerColumn}>
          <div className={styles.scanPanel}>
            <BarcodeField
              inputId={PDV_BARCODE_INPUT_ID}
              inputClassName={barcodeStyles.inputLarge}
              disabled={submitting}
              loading={buscandoCodigo}
              feedback={barcodeFeedback}
              onSubmitCode={handleBarcode}
            />
            {produtoPreview && (
              <p className={styles.lastItem} role="status">
                Último: {produtoPreview.nome} · Estoque disp.: {produtoPreview.saldo}
              </p>
            )}
          </div>

          <div className={styles.tablePanel}>
            <h2 className={styles.panelTitle}>Itens ({cart.length})</h2>
            {cart.length === 0 ? (
              <p className={styles.emptyCart}>Escaneie um produto para iniciar a venda.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Produto</th>
                      <th scope="col">Qtd</th>
                      <th scope="col">Preço un.</th>
                      <th scope="col">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((line, index) => {
                      const selected = line.key === selectedKey
                      return (
                        <tr
                          key={line.key}
                          className={selected ? styles.rowSelected : undefined}
                          onClick={() => selectLine(line)}
                        >
                          <td className={styles.colIndex}>{index + 1}</td>
                          <td className={styles.colProduct}>
                            <span className={styles.productName}>{line.produtoNome}</span>
                            <span className={styles.productStock}>
                              Estoque disp.: {line.saldoMax}
                            </span>
                          </td>
                          <td className={styles.colQty}>
                            <div className={styles.qtyRow}>
                              <button
                                type="button"
                                className={styles.qtyBtn}
                                disabled={submitting}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateQuantidade(line.key, -1)
                                }}
                                aria-label="Diminuir quantidade"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                className={styles.qtyInput}
                                data-pdv-qty={line.key}
                                min={1}
                                max={line.saldoMax}
                                step={1}
                                value={line.quantidade}
                                disabled={submitting}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  setQuantidadeDigitada(line.key, e.target.value)
                                }
                                aria-label={`Quantidade de ${line.produtoNome}`}
                              />
                              <button
                                type="button"
                                className={styles.qtyBtn}
                                disabled={submitting || line.quantidade >= line.saldoMax}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateQuantidade(line.key, 1)
                                }}
                                aria-label="Aumentar quantidade"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className={styles.colPrice}>{formatPreco(line.precoUnitario)}</td>
                          <td className={styles.colSubtotal}>
                            {formatPreco(calcularSubtotalItem(toItemRequest(line)))}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <aside className={styles.checkoutColumn}>
          <div className={styles.totalPanel}>
            <p className={styles.totalLabel}>Total a pagar</p>
            <p className={styles.totalValue}>{formatPreco(totalEstimado)}</p>
            <p className={styles.totalHint}>
              {cart.length === 0
                ? 'Nenhum item no carrinho'
                : `${cart.length} ${cart.length === 1 ? 'item' : 'itens'}`}
            </p>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <form ref={finalizeFormRef} onSubmit={(e) => void handleSubmit(e)}>
            <button
              type="submit"
              className={styles.finalizeBtn}
              disabled={submitting || cart.length === 0}
            >
              {submitting ? 'Finalizando…' : 'Finalizar venda (F10)'}
            </button>
          </form>

          <button type="button" className={styles.secondaryBtn} disabled={submitting} onClick={novaVenda}>
            Nova venda (F5)
          </button>

          <details
            className={styles.clienteDetails}
            open={clienteAberto}
            onToggle={(e) => setClienteAberto(e.currentTarget.open)}
          >
            <summary className={styles.clienteSummary}>Cliente (opcional)</summary>
            <ClienteBuscaSection busca={clienteBusca} disabled={submitting} />
          </details>

          <p className={styles.footerHint}>
            Formas de pagamento (Pix, cartão, dinheiro) entram na fase <strong>14+</strong>. Hoje a
            venda é registrada como <strong>PAGA</strong> ao finalizar.
          </p>
        </aside>

        <PdvCupomPreview
          cart={cart}
          total={totalEstimado}
          operadorNome={session?.nome ?? 'Operador'}
          clienteResumo={clienteResumo}
          vendaNumero={vendaFinalizada?.id ?? null}
        />
      </div>
    </section>
  )
}
