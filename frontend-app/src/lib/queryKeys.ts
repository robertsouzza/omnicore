/** Chaves estáveis para TanStack Query — invalidação cruzada estoque ↔ produtos ↔ vendas. */
export interface ProdutosListFilters {
  page: number
  incluirInativos: boolean
  nome?: string
  codigoBarras?: string
}

export const queryKeys = {
  produtos: {
    all: ['produtos'] as const,
    lists: () => [...queryKeys.produtos.all, 'list'] as const,
    list: (filters: ProdutosListFilters) => [...queryKeys.produtos.lists(), filters] as const,
    detail: (id: number) => [...queryKeys.produtos.all, 'detail', id] as const,
    codigos: (id: number) => [...queryKeys.produtos.all, 'codigos', id] as const,
  },
  estoque: {
    all: ['estoque'] as const,
    saldo: (produtoId: number) => [...queryKeys.estoque.all, 'saldo', produtoId] as const,
    indicador: (produtoId: number) =>
      [...queryKeys.estoque.all, 'indicador', produtoId] as const,
  },
  vendas: {
    all: ['vendas'] as const,
    lists: () => [...queryKeys.vendas.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.vendas.lists(), filters] as const,
    detail: (id: number) => [...queryKeys.vendas.all, 'detail', id] as const,
  },
} as const
