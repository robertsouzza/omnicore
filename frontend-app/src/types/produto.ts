export type TipoProduto = 'UNITARIO' | 'PACOTE'
export type IndicadorTamanho = 'UNICO' | 'P' | 'M' | 'G' | 'GG' | 'INFANTIL'

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
