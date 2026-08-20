export type TipoProduto = 'UNITARIO' | 'PACOTE'
export type IndicadorTamanho = 'PEQUENO' | 'MEDIO' | 'GRANDE'

export interface Produto {
  id: number
  codigoBarras: string
  nome: string
  descricao: string | null
  precoVenda: number
  categoria: string
  urlImagem: string | null
  tipoProduto: TipoProduto
  indicadorTamanho: IndicadorTamanho
  ativo: boolean
  createdAt: string
  updatedAt: string
}

export interface ProdutoRequest {
  codigoBarras: string
  nome: string
  descricao?: string | null
  precoVenda: number
  categoria: string
  urlImagem?: string | null
  tipoProduto: TipoProduto
  indicadorTamanho: IndicadorTamanho
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export const TIPOS_PRODUTO: { value: TipoProduto; label: string }[] = [
  { value: 'UNITARIO', label: 'Unitário' },
  { value: 'PACOTE', label: 'Pacote' },
]

export const INDICADORES_TAMANHO: { value: IndicadorTamanho; label: string }[] = [
  { value: 'PEQUENO', label: 'Pequeno' },
  { value: 'MEDIO', label: 'Médio' },
  { value: 'GRANDE', label: 'Grande' },
]
