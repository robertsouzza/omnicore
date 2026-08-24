import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { buscarClientePorDocumento, listarClientes } from '../api/clientes'
import { listarProdutos } from '../api/produtos'
import { criarVenda } from '../api/vendas'
import { useAuth } from '../auth/AuthContext'
import type { Cliente } from '../types/cliente'
import { TIPO_DOCUMENTO_PADRAO, TIPOS_DOCUMENTO } from '../types/cliente'
import type { ItemVendaRequest, StatusVenda } from '../types/venda'
import {
  STATUS_NOVA_VENDA,
  calcularSubtotalItem,
  calcularTotalItens,
  formatPreco,
} from '../types/venda'
import { isCpfValido } from '../utils/cpf'
import {
  formatDocumentoDisplay,
  maskDocumentoInput,
  normalizeNumeroDocumento,
  type TipoDocumento,
} from '../utils/documento'
import type { ProdutoComSaldo } from '../utils/produtoEstoque'
import { filtrarProdutosComSaldoPositivo, rotuloSaldoProduto } from '../utils/produtoEstoque'
import { getErrorMessage } from '../utils/validation'
import styles from './NovaVendaPage.module.css'

const BUSCA_MIN_API = 3

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

interface CartLine {
  key: string
  produtoId: number
  produtoNome: string
  quantidade: number
  precoUnitario: number
  desconto: number
}

let cartKeyCounter = 0

function nextCartKey(): string {
  cartKeyCounter += 1
  return `line-${cartKeyCounter}`
}

function toItemRequest(line: CartLine): ItemVendaRequest {
  return {
    produtoId: line.produtoId,
    quantidade: line.quantidade,
    precoUnitario: line.precoUnitario,
    desconto: line.desconto > 0 ? line.desconto : null,
  }
}

export function NovaVendaPage() {
  const navigate = useNavigate()
  const { session, logout } = useAuth()

  const [status, setStatus] = useState<StatusVenda>('PENDENTE')
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [nomeOcasional, setNomeOcasional] = useState('')
  const [clienteBusca, setClienteBusca] = useState('')
  const [clienteBuscaDebounced, setClienteBuscaDebounced] = useState('')
  const [clientesSugeridos, setClientesSugeridos] = useState<Cliente[]>([])
  const [tipoDocumentoBusca, setTipoDocumentoBusca] = useState<TipoDocumento>(TIPO_DOCUMENTO_PADRAO)
  const [documentoBusca, setDocumentoBusca] = useState('')
  const [clienteNotice, setClienteNotice] = useState<string | null>(null)
  const [buscandoDocumento, setBuscandoDocumento] = useState(false)

  const [produtoBusca, setProdutoBusca] = useState('')
  const [produtoBuscaDebounced, setProdutoBuscaDebounced] = useState('')
  const [produtosSugeridos, setProdutosSugeridos] = useState<ProdutoComSaldo[]>([])
  const [buscandoProdutos, setBuscandoProdutos] = useState(false)
  const [produtoNotice, setProdutoNotice] = useState<string | null>(null)

  const [cart, setCart] = useState<CartLine[]>([])
  const [error, setError] = useState<string | null>(null)
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const termo = clienteBusca.trim()
      setClienteBuscaDebounced(termo.length >= BUSCA_MIN_API ? termo : '')
    }, 300)
    return () => window.clearTimeout(timer)
  }, [clienteBusca])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const termo = produtoBusca.trim()
      setProdutoBuscaDebounced(termo.length >= BUSCA_MIN_API ? termo : '')
    }, 300)
    return () => window.clearTimeout(timer)
  }, [produtoBusca])

  useEffect(() => {
    if (!session || clienteBuscaDebounced.length < BUSCA_MIN_API) {
      setClientesSugeridos([])
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const data = await listarClientes(session.token, {
          page: 0,
          size: 8,
          nome: clienteBuscaDebounced,
        })
        if (!cancelled) setClientesSugeridos(data.content)
      } catch (err) {
        if (handleUnauthorized(err)) return
      }
    })()

    return () => {
      cancelled = true
    }
  }, [session, clienteBuscaDebounced, handleUnauthorized])

  useEffect(() => {
    if (!session || produtoBuscaDebounced.length < BUSCA_MIN_API) {
      setProdutosSugeridos([])
      setProdutoNotice(null)
      return
    }

    let cancelled = false
    setBuscandoProdutos(true)
    setProdutoNotice(null)

    void (async () => {
      try {
        const trimmed = produtoBuscaDebounced.trim()
        const digits = onlyDigits(trimmed)
        const buscaPorCodigo = digits.length >= BUSCA_MIN_API && /^\d+$/.test(trimmed)

        const data = await listarProdutos(session.token, {
          page: 0,
          size: 20,
          nome: buscaPorCodigo ? undefined : produtoBuscaDebounced,
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
  }, [session, produtoBuscaDebounced, handleUnauthorized])

  const itensRequest = useMemo(() => cart.map(toItemRequest), [cart])
  const totalEstimado = useMemo(() => calcularTotalItens(itensRequest), [itensRequest])

  const statusHint = STATUS_NOVA_VENDA.find((s) => s.value === status)?.hint ?? ''

  function selecionarCliente(cliente: Cliente) {
    setClienteSelecionado(cliente)
    setClienteBusca('')
    setClientesSugeridos([])
    setDocumentoBusca('')
    setClienteNotice(null)
    setNomeOcasional('')
  }

  function limparClienteSelecionado() {
    setClienteSelecionado(null)
  }

  async function handleBuscarDocumento() {
    if (!session) return

    const numero = normalizeNumeroDocumento(tipoDocumentoBusca, documentoBusca)

    if (tipoDocumentoBusca === 'CPF') {
      if (numero.length < 11) {
        setClienteNotice('Informe um CPF com 11 dígitos para buscar.')
        return
      }
      if (!isCpfValido(numero)) {
        setClienteNotice('Informe um CPF válido para buscar.')
        return
      }
    } else if (numero.length < 3) {
      setClienteNotice('Informe pelo menos 3 caracteres do documento para buscar.')
      return
    }

    setBuscandoDocumento(true)
    setClienteNotice(null)

    try {
      const cliente = await buscarClientePorDocumento(session.token, tipoDocumentoBusca, numero)
      selecionarCliente(cliente)
    } catch (err) {
      if (handleUnauthorized(err)) return
      setClienteNotice(getErrorMessage(err, 'Nenhum cliente encontrado para este documento.'))
    } finally {
      setBuscandoDocumento(false)
    }
  }

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
    setProdutoBusca('')
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

    if (cart.length === 0) {
      setError('Adicione ao menos um produto ao carrinho.')
      return
    }

    for (const line of cart) {
      if (line.quantidade < 1) {
        setError('Quantidade deve ser maior que zero em todos os itens.')
        return
      }
      if (line.precoUnitario < 0) {
        setError('Preço unitário inválido.')
        return
      }
      if (line.desconto < 0 || line.desconto > line.precoUnitario) {
        setError('Desconto inválido em um dos itens.')
        return
      }
    }

    setSubmitting(true)
    setError(null)

    try {
      const venda = await criarVenda(session.token, {
        status,
        vendedorId: session.colaboradorId,
        clienteId: clienteSelecionado?.id ?? null,
        nomeClienteOcasional: !clienteSelecionado && nomeOcasional.trim() ? nomeOcasional.trim() : null,
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

          <label className={styles.field}>
            Buscar cliente por nome
            <input
              className={styles.input}
              value={clienteBusca}
              onChange={(e) => {
                setClienteBusca(e.target.value)
                setClienteNotice(null)
              }}
              placeholder="Digite parte do nome (3+ letras)"
              disabled={submitting || Boolean(clienteSelecionado)}
              autoComplete="off"
            />
          </label>

          {clienteSelecionado ? (
            <div className={styles.selectedChip}>
              <span>
                {clienteSelecionado.nomeCompleto}
                {' · '}
                {formatDocumentoDisplay(
                  clienteSelecionado.tipoDocumento,
                  clienteSelecionado.numeroDocumento,
                )}
              </span>
              <button
                type="button"
                className={styles.chipRemove}
                onClick={limparClienteSelecionado}
                disabled={submitting}
              >
                ×
              </button>
            </div>
          ) : (
            <>
              {clientesSugeridos.length > 0 && (
                <ul className={styles.suggestions}>
                  {clientesSugeridos.map((cliente) => (
                    <li key={cliente.id}>
                      <button
                        type="button"
                        className={styles.suggestionBtn}
                        onClick={() => selecionarCliente(cliente)}
                      >
                        <span>{cliente.nomeCompleto}</span>
                        <span className={styles.suggestionMeta}>
                          {formatDocumentoDisplay(cliente.tipoDocumento, cliente.numeroDocumento)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className={styles.documentoBusca}>
                <span className={styles.documentoLabel}>Ou buscar por documento</span>
                <div className={styles.documentoForm}>
                  <label className={styles.documentoField}>
                    Tipo
                    <select
                      className={styles.selectSmall}
                      value={tipoDocumentoBusca}
                      onChange={(e) => {
                        setTipoDocumentoBusca(e.target.value as TipoDocumento)
                        setDocumentoBusca('')
                        setClienteNotice(null)
                      }}
                      disabled={submitting}
                    >
                      {TIPOS_DOCUMENTO.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.documentoFieldGrow}>
                    Documento
                    <input
                      className={styles.input}
                      value={documentoBusca}
                      onChange={(e) => {
                        setDocumentoBusca(maskDocumentoInput(tipoDocumentoBusca, e.target.value))
                        setClienteNotice(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          void handleBuscarDocumento()
                        }
                      }}
                      placeholder={
                        tipoDocumentoBusca === 'CPF'
                          ? '000.000.000-00'
                          : 'Número do documento'
                      }
                      inputMode={tipoDocumentoBusca === 'CPF' ? 'numeric' : 'text'}
                      maxLength={tipoDocumentoBusca === 'CPF' ? 14 : 30}
                      disabled={submitting}
                      autoComplete="off"
                    />
                  </label>
                  <button
                    type="button"
                    className={styles.searchDocBtn}
                    disabled={submitting || buscandoDocumento}
                    onClick={() => void handleBuscarDocumento()}
                  >
                    {buscandoDocumento ? 'Buscando…' : 'Buscar'}
                  </button>
                </div>
              </div>

              {clienteNotice && <p className={styles.notice}>{clienteNotice}</p>}
            </>
          )}

          {!clienteSelecionado && (
            <label className={styles.field}>
              Cliente ocasional <span className={styles.optional}>(opcional)</span>
              <input
                className={styles.input}
                value={nomeOcasional}
                onChange={(e) => setNomeOcasional(e.target.value)}
                placeholder="Nome rápido, sem cadastro"
                maxLength={100}
                disabled={submitting}
              />
            </label>
          )}
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Produtos</h2>

          <label className={styles.field}>
            Buscar produto
            <input
              className={styles.input}
              value={produtoBusca}
              onChange={(e) => {
                setProdutoBusca(e.target.value)
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
