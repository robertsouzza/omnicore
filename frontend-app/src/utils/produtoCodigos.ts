import type { TipoProduto } from '../types/produto'

export interface ProdutoQrPayloadInput {
  produtoId?: number
  codigoBarras: string
  nome: string
  descricao: string
  precoVenda: string
  categoria: string
  tipoProduto: TipoProduto
}

export function buildProdutoQrPayload(input: ProdutoQrPayloadInput): string {
  const payload = {
    v: 1,
    fonte: 'omnicore',
    ...(input.produtoId != null ? { id: input.produtoId } : {}),
    codigoBarras: input.codigoBarras.trim(),
    nome: input.nome.trim(),
    descricao: input.descricao.trim() || null,
    precoVenda: input.precoVenda.trim() ? Number(input.precoVenda) : null,
    categoria: input.categoria.trim(),
    tipoProduto: input.tipoProduto,
  }

  return JSON.stringify(payload)
}

export type BarcodeFormat = 'EAN13' | 'EAN8' | 'CODE128'

export function resolveBarcodeFormat(code: string): BarcodeFormat {
  const digits = code.replace(/\D/g, '')
  if (digits.length === 13) return 'EAN13'
  if (digits.length === 8) return 'EAN8'
  return 'CODE128'
}

export function barcodeValueForFormat(code: string, format: BarcodeFormat): string {
  const trimmed = code.trim()
  if (format === 'CODE128') return trimmed
  return trimmed.replace(/\D/g, '')
}
