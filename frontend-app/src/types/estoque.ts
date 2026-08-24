import type { Page } from './produto'

export type { Page }

export type TipoMovimentacaoEstoque = 'ENTRADA' | 'SAIDA'

export interface MovimentacaoEstoqueRequest {
  produtoId: number
  quantidade: number
  justificativa?: string | null
}

export interface MovimentacaoEstoque {
  id: number
  produtoId: number
  tipo: TipoMovimentacaoEstoque
  quantidade: number
  dataHora: string
  justificativa: string | null
  vendaId: number | null
}
