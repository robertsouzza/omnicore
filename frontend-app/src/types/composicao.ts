import type { Produto } from './produto'

export interface ComposicaoPacote {
  id: number
  quantidade: number
  createdAt: string
  produtoFilho: Produto
}

export interface ComposicaoPacoteRequest {
  produtoFilhoId: number
  quantidade: number
}
