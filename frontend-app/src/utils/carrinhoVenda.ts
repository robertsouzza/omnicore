import type { ItemVendaRequest } from '../types/venda'

export interface CartLine {
  key: string
  produtoId: number
  produtoNome: string
  quantidade: number
  precoUnitario: number
  desconto: number
  /** Estoque disponível no momento em que o item entrou no carrinho. */
  saldoMax: number
}

export function clampQuantidade(quantidade: number, saldoMax: number): number {
  if (!Number.isFinite(quantidade) || quantidade < 1) return 1
  return Math.min(Math.floor(quantidade), Math.max(1, saldoMax))
}

export function parseQuantidadeInput(raw: string, saldoMax: number): number {
  const parsed = Number.parseInt(raw, 10)
  if (Number.isNaN(parsed)) return 1
  return clampQuantidade(parsed, saldoMax)
}

let cartKeyCounter = 0

export function nextCartKey(): string {
  cartKeyCounter += 1
  return `line-${cartKeyCounter}`
}

export function toItemRequest(line: CartLine): ItemVendaRequest {
  return {
    produtoId: line.produtoId,
    quantidade: line.quantidade,
    precoUnitario: line.precoUnitario,
    desconto: line.desconto > 0 ? line.desconto : null,
  }
}

/** Retorna mensagem de erro ou null se válido. */
export function validarCarrinho(cart: CartLine[]): string | null {
  if (cart.length === 0) return 'Adicione ao menos um produto ao carrinho.'

  for (const line of cart) {
    if (line.quantidade < 1) return 'Quantidade deve ser maior que zero em todos os itens.'
    if (line.quantidade > line.saldoMax) {
      return `"${line.produtoNome}": quantidade (${line.quantidade}) excede estoque disponível (${line.saldoMax}).`
    }
    if (line.precoUnitario < 0) return 'Preço unitário inválido.'
    if (line.desconto < 0 || line.desconto > line.precoUnitario) {
      return 'Desconto inválido em um dos itens.'
    }
  }

  return null
}
